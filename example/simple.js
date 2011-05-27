var smtp = require(__dirname + "/../lib/smtp"), status;

status = smtp.sendmail({
	"host"		: "mail.example.com",
	"auth"		: [ "root", "password" ],
	"from"		: "root@example.com",
	"to"		: [ "test1@example.com", "test2@example.com" ],
	"content"	: {
		"from"			: "Root",
		"to"			: "Test People",
		"subject"		: "Hello!",
		"content-type"	: "multipart/alternative",
		"content"		: [{
			"content-type"	: "text/html",
			"content"		: "Hello <strong>world</strong> :)"
		}, {
			"content-type"	: "text/plain",
			"content"		: "Hello world :) with some weird\nchars çäéũ§@"
		}]
	},
	"success"	: function () {
		console.log("sent!");
		process.exit(0);
	},
	"failure"	: function (err) {
		if (err.code) {
			console.log("Error(%s): %s", err.email, err.message);
			return;
		}
		console.log("Error(%d): %s", err.code, err.message);
		process.exit(1);
	}
});
