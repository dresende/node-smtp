## SMTP Client in Node

Connect to an SMTP server and send e-mails, authenticated or not. You can use the `Client` class
or the `sendmail` function. The later is recomended.

    sendmail({
    	"host"		: "mail.example.com",
    	"from"		: "john@example.com",
    	"to"		: [ "jane@example.com", "doe@example.com" ],
    	"auth"		: [ "john", "secret" ],
    	"content"	: {
    		"subject"		: "Hello Jane!",
    		"content-type"	: "text/html",
    		"content"		: "Hello <strong>Jane</strong>!"
    	},
    	"success"	: function () {
    		console.log("Sent!");
    	},
    	"failure"	: function (err) {
    		console.log("Error(%d): %s", err.code, err.message);
    	}
    });
