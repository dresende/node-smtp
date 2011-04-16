function buildContent(content) {
	var str = "", boundary = null;
	
	for (key in content) {
		if (key == "content") continue;
		if (!content.hasOwnProperty(key)) continue;
		
		str += key.replace(/(^|\-)(.)/g, function (m, c, l) { return c + l.toUpperCase() }) + ": " + content[key];
		
		if (key == "content-type") {
			if (content[key].toLowerCase().match(/^multipart\/./i)) {
				boundary = Math.random().toString().substr(2);
				str += "; boundary=\"" + boundary + "\"";
			}
		}
		
		str += "\r\n";
	}
		
	str += "\r\n";
	
	if (boundary !== null) {
		for (var i = 0; i < content.content.length; i++) {
			str += "--" + boundary + "\r\n"
			     + buildContent(content.content[i]) + "\r\n";
		}
		
		str += "--" + boundary + "--\r\n";
	} else {
		str += content.content;
	}
	
	return str;
};

exports.buildContent = buildContent;
