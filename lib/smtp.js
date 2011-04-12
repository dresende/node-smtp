var util = require("util"),
    events = require("events"),
    net = require("net");

var Client = function (opts) {
	this.host = "localhost";
	this.port = 25;
	this.buffer = "";

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
		console.log("error connecting");
	});
	this.sock.on("connect", function () {
		console.log("connected");
	});
	this.sock.on("data", function (data) {
		self.buffer += data;
		self._checkBuffer();
	});
	this.sock.on("close", function () {
		self.emit("close");
	});
};
Client.prototype.mailFrom = function (email) {
	console.log("mailFrom("+email+")");
	this.conversationStep = 2;
	this.sock.write("MAIL FROM:<" + email + ">\r\n");
};
Client.prototype.rcptTo = function (email) {
	console.log("rcptTo("+email+")");
	this.conversationStep = 3;
	this.sock.write("RCPT TO:<" + email + ">\r\n");
};
Client.prototype.data = function (data) {
	console.log("data("+data+")");
	this.conversationStep = 4;
	this.sock.write("DATA\r\n");
	this.sock.write(data);
};
Client.prototype.close = function () {
	console.log("close()");
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
	
	console.log(JSON.stringify({ code:code, msg:msg }));
	
	switch (code) {
		case "220":
		case "221":
		case "250":
			switch (this.conversationStep) {
				case 0: // send HELO
					this.conversationStep++;
					this.sock.write("HELO localhost\r\n");
					break;
				case 1: // HELO was accepted
					this.emit("connect");
					break;
				case 2: // MAIL FROM was accepted
					this.emit("mailFrom");
					break;
				case 3: // RCPT TO was accepted
					this.emit("rcptTo");
					break;
				case 4: // DATA was accepted
					this.emit("data");
					break;
				case 5: // QUIT was accepted
					this.sock.end();
			}
			break;
		case "554":
			this.emit("err", { "code": code, "message": msg });
			break;
	}
};

exports.Client = Client;
