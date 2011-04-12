var smtp = require(__dirname + "/../lib/smtp"),
	client = new (smtp.Client)();

client.connect("localhost");
client.on("connect", function () {
	client.mailFrom("root@localhost");
});
client.on("mailFrom", function () {
	client.rcptTo("root@localhost");
});
client.on("rcptTo", function () {
	client.data(
		"From: \"Root\" <root@localhost>\r\n" +
		"Date: " + (new Date()) + "\r\n" +
		"Subject: hello world\r\n" +
		"\r\n" +
		"Hello world\r\n" +
		".\r\n");
});
client.on("data", function () {
	client.close();
});
client.on("close", function () {
	console.log("done!");
	process.exit(0);
});
