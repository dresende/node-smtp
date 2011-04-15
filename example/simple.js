var smtp = require(__dirname + "/../lib/smtp"), status;

status = smtp.sendmail({
	"host"		: "localhost",
	"from"		: "root@localhost",
	"to"		: [ "root@localhost" ],
	"auth"		: [ "root", "password" ],
	"content"	: {
		"from"			: "Diogo",
		"to"			: "Diogo",
		"subject"		: "hello world subject",
		"content-type"	: "multipart/alternative",
		"content"		: [{
			"content-type"	: "text/html",
			"content"		: "Hello <strong>world</strong> :)"
		}, {
			"content-type"	: "text/plain",
			"content"		: "Hello world :)"
		}]
	},
	"success"	: function () {
		console.log("sent!");
		process.exit(0);
	},
	"failure"	: function (err) {
		console.log("Error(%d): %s", err.code, err.message);
		process.exit(1);
	}
});
