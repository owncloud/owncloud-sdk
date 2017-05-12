var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');

var doc = yaml.safeLoad(fs.readFileSync(path.join(__dirname, "../api/swagger/swagger.yaml")));
fs.writeFileSync(
	path.join(__dirname, "../assets/api-docs.json"),
	JSON.stringify(doc, null, " ")
);