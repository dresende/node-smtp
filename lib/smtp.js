var util = require("util"),
    events = require("events"),
    net = require("net"),
    crypto = require("crypto"),
    os = require("os"),
    sendmail = require("./sendmail"),
    mimebuild = require("./mimebuild");

var Client = function (opts) {
	this.host = "localhost";
	this.port = 25;
	this.buffer = "";
	this._auth_supported = [ "CRAM-MD5", "LOGIN", "PLAIN" ];
	this._auth_mechs = [];

	events.EventEmitter.call(this);
};

util.inherits(Client, events.EventEmitter);

Client.prototype.connect = function () {
	for (var i = 0; i < arguments.length; i++) {
		switch (typeof arguments[i]) {
			case "string":
				this.host = arguments[i];
				break;
			case "number":
				this.port = arguments[i];
				break;
		}
	}
	
	var self = this;

	this.conversationStep = 0;
	this.sock = new net.Socket();
	this.sock.setEncoding("ascii");
	this.sock.connect(this.port, this.host);
	this.sock.on("error", function () {
		self.emit("debug", "error connecting ("+this.host+":"+this.por+")");
	});
	this.sock.on("connect", function () {
		self.emit("debug", "connected");
	});
	this.sock.on("data", function (data) {
		self.buffer += data;
		self._checkBuffer();
	});
	this.sock.on("close", function () {
		self.emit("close");
	});
};
Client.prototype.authenticate = function (username, password, method) {
	if (typeof method == "undefined") {
		for (var i = 0; i < this._auth_supported.length; i++) {
			if (this._auth_mechs.indexOf(this._auth_supported[i]) != -1) {
				method = this._auth_supported[i];
				break;
			}
		}
		if (typeof method == "undefined") {
			this.emit("err", { "code": 597, "message": "Client seems not to support any server auth mechanism" });
			return;
		}
	} else {
		method = method.toUpperCase();
	}
	if ([ "PLAIN", "LOGIN", "CRAM-MD5" ].indexOf(method) == -1) {
		this.emit("err", { "code": 595, "message": "Auth mechanism not supported by client" });
		return;
	}
	if (this._auth_mechs.indexOf(method) == -1) {
		this.emit("err", { "code": 596, "message": "Auth mechanism not supported by server" });
		return;
	}

	switch (method) {
		case "LOGIN":
		case "CRAM-MD5":
			this.conversationStep = 10;
			this._auth_method = method;
			this._auth_username = username;
			this._auth_password = password;
			this.sock.write("AUTH " + method + "\r\n");
			break;
		case "PLAIN":
			var buf = new Buffer(username + "\0" + username + "\0" + password);
			this.sock.write("AUTH PLAIN " + buf.toString("base64") + "\r\n");
			break;
	}
};
Client.prototype.mailFrom = function (email) {
	this.conversationStep = 2;
	this.sock.write("MAIL FROM:<" + email + ">\r\n");
};
Client.prototype.rcptTo = function (email) {
	this.conversationStep = 3;
	this.sock.write("RCPT TO:<" + email + ">\r\n");
};
Client.prototype.data = function (data) {
	this.conversationStep = 4;
	this.sock.write("DATA\r\n");
	if (typeof data == "string") {
		this.sock.write(data + "\r\n.\r\n");
	} else {
		this.sock.write(mimebuild.buildContent(data) + "\r\n.\r\n");
	}
};
Client.prototype.close = function () {
	this.conversationStep = 5;
	this.sock.write("QUIT\r\n");
};
Client.prototype._checkBuffer = function () {
	var p = this.buffer.indexOf("\r\n");
	if (p == -1) return;
	
	var msg = this.buffer.slice(0, p);
	this.buffer = this.buffer.slice(p + 2);

	this._processMessage(msg);
	this._checkBuffer();
};
Client.prototype._processMessage = function (msg) {
	var p = msg.indexOf(" ");
	if (p == -1) return;
	
	var code = msg.slice(0, p);
	msg = msg.slice(p + 1).trim();

	this.emit("debug", JSON.stringify({ code:code, msg:msg }));

	switch (code) {
		case "220":
		case "221":
		case "250":
			switch (this.conversationStep) {
				case 0: // send HELO
					this.conversationStep++;
					this.sock.write("EHLO " + os.hostname() + "\r\n");
					break;
				case 1: // HELO was accepted
					this.emit("connect");
					break;
				case 2: // MAIL FROM was accepted
					this.emit("mailFrom");
					break;
				case 3: // RCPT TO was accepted
					this.emit("rcptTo", true);
					break;
				case 4: // DATA was accepted
					this.emit("data");
					break;
				case 5: // QUIT was accepted
					this.sock.end();
			}
			break;
		case "250-AUTH":
			this._auth_mechs = this._auth_mechs.concat(msg.split(" "));
			break;
		case "250-AUTH=PLAIN":
			this._auth_mechs = this._auth_mechs.concat(msg.split(" "));
			break;
		case "235":
			this.conversationStep = 1;
			this.emit("auth", true);
			break;
		case "334": // AUTH LOGIN
			switch (this.conversationStep) {
				case 10:
					this.conversationStep = 11;
					switch (this._auth_method) {
						case "LOGIN":
							var buf = new Buffer(this._auth_username);
							this.sock.write(buf.toString("base64") + "\r\n");
							break;
						case "CRAM-MD5":
							var hmac = crypto.createHmac('md5', this._auth_password);
							msg = (new Buffer(msg, "base64")).toString("ascii");
							hmac.update(msg);

							this.sock.write((new Buffer(this._auth_username + " " + hmac.digest("hex")).toString("base64")) + "\r\n");
							break;
					}
					break;
				case 11:
					this.conversationStep = 12;
					switch (this._auth_method) {
						case "LOGIN":
							var buf = new Buffer(this._auth_password);
							this.sock.write(buf.toString("base64") + "\r\n");
							break;
					}
					break;
				default:
					this.emit("err", { "code": code, "message": msg });
			}
			break;
		case "550":
			switch (this.conversationStep) {
				case 3: // RCPT TO was rejected
					this.emit("rcptTo", false);
			}
			break;
		case "504":
		case "554":
		case "535":
			this.emit("err", { "code": code, "message": msg });
			break;
	}
};

exports.Client = Client;
exports.sendmail = function (opts) {
	return sendmail.sendmail(Client, opts);
};
