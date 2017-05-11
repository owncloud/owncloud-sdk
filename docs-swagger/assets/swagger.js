var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');

//gulp.task('swagger', function() {
	var doc = yaml.safeLoad(fs.readFileSync(path.join(__dirname, "../api/swagger/swagger.yaml")));
	console.log(JSON.stringify(doc));
	fs.writeFileSync(
		path.join(__dirname, "../assets/api-docs.json"),
		JSON.stringify(doc, null, " ")
	);
//});