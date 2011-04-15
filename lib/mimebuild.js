function buildContent(content) {
	var str = "", boundary = null;
	
	for (key in content) {
		if (key == "content") continue;
		if (!content.hasOwnProperty(key)) continue;
		
		str += key + ": " + content[key];
		
		if (key == "content-type") {
			switch (content[key].toLowerCase()) {
				case "multipart/alternative":
					boundary = "boundary_xpto";
					str += "; boundary=\"" + boundary + "\"";
					break;
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
