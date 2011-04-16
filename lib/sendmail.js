var path = require("path"),
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
	
	var client = new Client(),
	    to_index = 0;
	
	client.connect(opts.host || "127.0.0.1", opts.port || 25);
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
		client.rcptTo(opts.to[to_index++]);
	});
	client.on("rcptTo", function () {
		if (opts.to.length > to_index) {
			client.rcptTo(opts.to[to_index++]);
			return;
		}

		if (opts.contentPath) {
			path.exists(opts.contentPath, function (exists) {
				if (!exists) {
					return opts.failure({ "code": 3, "message": "Content file " + opts.contentPath + " does not exist" });
				}
				fs.readFile(opts.contentPath, function (err, data) {
					if (err) {
						return opts.failure(err);
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
