var express = require("express");
var owncloud = require("../../js-owncloud-client");
var cors = require('cors');
var app = express();
var oc;
app.use(express.static('assets'));
app.use(cors());

app.get('/', function(request, response) {
	response.redirect("doc.html");
});

app.get('/initLibrary', function(request, response) {
	var url = request.query.url;
	oc = new owncloud(url);
	response.send("success");
});

app.get('/login', function(request, response) {
	var uname = request.query.user;
	var pass = request.query.pass;
	if (request.query.sessionUrl) {
		var url = request.query.sessionUrl;
		oc = new owncloud(url);
	}

	if (!oc) {
		response.send("Please initialise the library with a running ownCloud URL first.");
		return;
	}

	oc.login(uname, pass, function (error, body) {
		response.send(error || body);
	});
});

app.get('/getApps', function(request, response) {
	if (!oc) {
		response.send("Please initialise the library with a running ownCloud URL first.");
		return;
	}
	oc.getApps(function (error, body) {
		response.send(error || body);
	});
});

app.get('/shareFileWithLink', function(request, response) {
	var path = request.query.path;
	if (!oc) {
		response.send("Please initialise the library with a running ownCloud URL first.");
		return;
	}
	oc.shareFileWithLink(path, function(error, body) {
		//response.send("path = " + body.getPath());
		response.send(error || body);
	});
});

app.get('/getShares', function(request, response) {
	var path = request.query.path;
	var optional = {};

	if (request.query.reshares) {
		optional['reshares'] = request.query.reshares;
	}
	if (request.query.subfiles) { 
		optional['subfiles'] = request.query.subfiles;
	}
	if (request.query.shared_with_me) {
		optional['shared_with_me'] = request.query.shared_with_me;
	}

	if (!oc) {
		response.send("Please initialise the library with a running ownCloud URL first.");
		return;
	}
	oc.getShares(path, optional, function(error, body) {
		//response.send("path = " + body.getPath());
		response.send(error || body);
	});
});

app.get('/isShared', function(request, response) {
	var path = request.query.path;
	if (!oc) {
		response.send("Please initialise the library with a running ownCloud URL first.");
		return;
	}
	oc.isShared(path, function(error, body) {
		//response.send("path = " + body.getPath());
		if (!error && body == true) {
			response.send("already shared!");
		}
		else if (error) {
			response.send(error);
		}
		else {
			response.send("not shared yet!");
		}
	});
});

app.get('/getShare', function(request, response) {
	var shareId = request.query.shareId;
	if (!oc) {
		response.send("Please initialise the library with a running ownCloud URL first.");
		return;
	}
	oc.getShare(shareId, function(error, body) {
		//response.send("path = " + body.getPath());
		response.send(error || body);
	});
});

app.get('/createUser', function(request, response) {
	var uname = request.query.username;
	var pass = request.query.password;
	if (!oc) {
		response.send("Please initialise the library with a running ownCloud URL first.");
		return;
	}
	oc.createUser(uname, pass, function (error, body) {
		response.send(error || body);
	});
});

/*app.get('/asd', function(request , response) {
	var requestPromise = require('request-promise');

	var user = 'I2ZBdPYcNokkcmI643kqfS7UsAfVyGapAzyZFIsV2Zj9jw4YRExoMuB97ityA89W';
	var password = 'pUQIp4tNA76m1w2wViZ2vZRa3hXaJGiQTzumcWIDpKxNVfFJgXVIkmRZSt2HAkVd';

	var base64encodedData = new Buffer(user + ':' + password).toString('base64');

	requestPromise.get({
		uri: 'http://localhost/core/index.php/apps/oauth2/api/v1/token',
		headers: {
			'Authorization': 'Basic ' + base64encodedData
		},
		qs : {
			'grant_type' : 'authorization_code',
			'code' : 'KmedYjYlEtMwVPnSX0DQFgqAeUSzFunauYWmLUTDZIEquO1hVd5vFpKwHk035gqt',
			'redirect_uri' : encodeURIComponent('http://localhost:8080'),
		}
	}).then(function ok(jsonData) {
		console.dir(jsonData);
	});
});*/

var port = process.env.PORT || 8080
var server = app.listen(port, function() {
	console.log("server started");
});