var smtp = require(__dirname + "/../lib/smtp"), status;

status = smtp.sendmail({
	// there's no "host": "...", it will try to find it using destination e-mails
	"from"		: "root@example.com",
	"to"		: [ "test@example.com" ],
	"content"	: {
		"from"			: "Root",
		"to"			: "Test Guy",
		"subject"		: "Hello!",
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
		if (err.code) {
			console.log("Error(%s): %s", err.email, err.message);
			return;
		}
		console.log("Error(%d): %s", err.code, err.message);
		process.exit(1);
	}
});
