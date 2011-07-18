## Installation

    npm install smtpc

## Usage (require..)

    var smtpc = require("smtpc");

## Send an e-mail

Connect to an SMTP server and send e-mails, authenticated or not. You can use the `Client` class
or the `sendmail` function. The later is recommended.

    smtpc.sendmail({
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

## Parameters

- `host` (default = "127.0.0.1"): Server to connect to;
- `port` (default = 25): Server port to connect to;
- `auth` (optional): Authentication to use. Should be an array with **username**, **password** and
  **method** (optional). Methods supported: **PLAIN**, **LOGIN** and **CRAM-MD5** (default);
- `from` (default = "root@localhost"): Origin e-mail.
- `to`: Destination e-mail(s). It can be a string with one e-mail or an array with all the e-mails.
- `content`: Content of the e-mail. It can be a string or an object with all the e-mail parts (or just 1).
- `contentPath`: If you prefer, you can have the e-mail generated on a file and supply it instead of `content`.
- `success` (optional): Callback invoked when e-mail has successfully been sent.
- `failure` (optional): Callback invoked when some error ocurred.
