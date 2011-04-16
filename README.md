## SMTP Client in Node

Connect to an SMTP server and send e-mails, authenticated or not. You can use the `Client` class
or the `sendmail` function. The later is recomended.

    sendmail({
    	"host"		: "mail.example.com",
    	"from"		: "john@example.com",
    	"to"		: [ "jane@example.com", "doe@example.com" ],
    	"content"	: "Hello Jane!", // you can send a structure
    	"success"	: function () {
    		console.log("Sent!");
    	},
    	"failure"	: function (err) {
    		console.log("Error(%d): %s", err.code, err.message);
    	}
    });
