var path = require("path"),
    dns = require("dns"),
    fs = require("fs");

exports.sendmail = function (Client, opts) {
	opts = opts || {};
	if (typeof opts.to == "string") {
		opts.to = [ opts.to ];
	} else if (!opts.to || !opts.to.length) {
		throw { "code": 1, "message": "You must define destination e-mails using 'to' parameter" };
	}
	if (!opts.content && !opts.contentPath) {
		throw { "code": 2, "message": "You must define e-mail data/file using 'content' or 'contentPath' parameter" };
	}

	if (!opts.hasOwnProperty("host")) {
		var hosts = {
			// server : [ email1, .. ]
		}, hostsMissing = opts.to.length;
		for (var i = 0; i < opts.to.length; i++) {
			getServerFromEmail(opts.to[i], function (err, host, email) {
				hostsMissing--;
				if (err) {
					if (opts.failure) {
						opts.failure(err);
					}
					return;
				}
				if (!hosts.hasOwnProperty(host)) {
					hosts[host] = [];
				}
				hosts[host].push(email);
				
				if (hostsMissing == 0) {
					sendEmailBulk(Client, opts, hosts);
				}
			});
		}
	} else {
		sendEmail(Client, opts, opts.host, opts.to);
	}
};

function getServerFromEmail(email, cb) {
	var domain = email, p = domain.indexOf("@");
	if (p != -1) domain = domain.substr(p + 1);
	
	dns.resolve(domain, "MX", function (err, addresses) {
		if (err) return cb(err);
		
		return cb(null, addresses[0].exchange, email, domain);
	});
};

function sendEmailBulk(Client, opts, hosts) {
	for (smtpserver in hosts) {
		if (!hosts.hasOwnProperty(smtpserver)) continue;

		//console.log("sending mail using %s to", smtpserver, hosts[smtpserver]);
		sendEmail(Client, opts, smtpserver, hosts[smtpserver]);
	}
};

function sendEmail(Client, opts, host, to) {
	var to_index = 0, client = new Client();

	client.connect(host || "127.0.0.1", opts.port || 25);
	client.on("connect", function () {
		if (opts.auth) {
			client.authenticate(
				opts.auth[0],
				opts.auth.length > 1 ? opts.auth[1] : "",
				opts.auth.length > 2 ? opts.auth[2] : "cram-md5"
			);
			return;
		} else {
			client.mailFrom(opts.from || "root@localhost");
		}
	});
	client.on("auth", function (success) {
		if (success) {
			client.mailFrom(opts.from || "root@localhost");
		} else if (opts.failure) {
			opts.failure(err);
		}
	});
	client.on("mailFrom", function () {
		client.rcptTo(to[to_index++]);
	});
	client.on("rcptTo", function (previous_accepted) {
		if (!previous_accepted && opts.failure) {
			opts.failure({ "code": 4, "message": "Recipient address rejected", "email": to[to_index - 1] });
		}
		if (to.length > to_index) {
			client.rcptTo(to[to_index++]);
			return;
		}

		if (opts.contentPath) {
			path.exists(opts.contentPath, function (exists) {
				if (!exists) {
					if (opts.failure) opts.failure({ "code": 3, "message": "Content file " + opts.contentPath + " does not exist" });
					return;
				}
				fs.readFile(opts.contentPath, function (err, data) {
					if (err) {
						if (opts.failure) opts.failure(err);
						return;
					}
					client.data(data);
				});
			});
		} else {
			client.data(opts.content);
		}
	});
	client.on("data", function () {
		client.close();
	});
	client.on("close", function () {
		if (opts.success) {
			opts.success();
		}
		return;
	});
	client.on("err", function (err) {
		if (opts.failure) {
			opts.failure(err);
		}
		return;
	});
};
