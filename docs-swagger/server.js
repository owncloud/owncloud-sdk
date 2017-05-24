var express = require("express");
var owncloud = require("../../js-owncloud-client");
var cors = require('cors');
var app = express();
var oc;

app.use(express.static('docs-swagger/assets'));
app.use(express.static('assets'));
app.use(cors());

function init() {
	oc = new owncloud('localhost/core');
	oc.login('noveens', '123');
}

/////////////////////////////
///////    GENERAL    ///////
/////////////////////////////

app.get('/', function(request, response) {
	response.redirect("index.html");
});

app.get('/initLibrary', function(request, response) {
	var url = request.query.url;
	oc = new owncloud(url);
	response.send(true);
});

app.get('/login', function(request, response) {
	var uname = request.query.user;
	var pass = request.query.pass;

	oc.login(uname, pass).then(result => {
		response.send(result);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getConfig', function(request, response) {
	init();
	oc.getConfig().then(result => {
		response.send(result);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getVersion', function(request, response) {
	init();
	oc.getVersion().then(result => {
		response.send(result);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getCapabilities', function(request, response) {
	init();
	oc.getCapabilities().then(result => {
		response.send(result);
	}).catch(error => {
		response.send(error);
	});
});

///////////////////////////////////
///////    APP MANGEMENT    ///////
///////////////////////////////////

app.get('/getApps', function(request, response) {
	init();
	oc.getApps().then(apps => {
		response.send(apps);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getAttribute', function(request, response) {
	var app = request.query.app;
	var key = request.query.key;

	init();
	oc.getAttribute(app, key).then(attr => {
		response.send(attr);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/setAttribute', function(request, response) {
	var app = request.query.app;
	var key = request.query.key;
	var value = request.query.value || '';

	init();
	oc.setAttribute(app, key, value).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/deleteAttribute', function(request, response) {
	var app = request.query.app;
	var key = request.query.key;

	init();
	oc.deleteAttribute(app, key).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/enableApp', function(request, response) {
	var appname = request.query.appname;
	
	init();
	oc.enableApp(appname).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/disableApp', function(request, response) {
	var appname = request.query.appname;
	
	init();
	oc.disableApp(appname).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

/////////////////////////////
///////    SHARING    ///////
/////////////////////////////

app.get('/shareFileWithLink', function(request, response) {
	var path = request.query.path;

	var optional = {};

	if (request.query.perms) {
		optional['perms'] = request.query.perms;
	}

	if (request.query.publicUpload) {
		optional['publicUpload'] = request.query.publicUpload;
	}

	if (request.query.password) {
		optional['password'] = request.query.password;
	}

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.shareFileWithLink(path, optional, function(error, body) {
		//response.send("path = " + body.getPath());
		response.send(error || body);
	});
});

app.get('/updateShare', function(request, response) {
	var shareId = request.query.shareId;

	var optional = {};

	if (request.query.perms) {
		optional['perms'] = request.query.perms;
	}

	if (request.query.publicUpload) {
		optional['publicUpload'] = request.query.publicUpload;
	}

	if (request.query.password) {
		optional['password'] = request.query.password;
	}

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.updateShare(shareId, optional, function(error, body) {
		//response.send("path = " + body.getPath());
		response.send(error || body);
	});
});

app.get('/shareFileWithUser', function(request, response) {
	var path = request.query.path;
	var username = request.query.username;

	var optional = {};

	if (request.query.perms) {
		optional['perms'] = request.query.perms;
	}

	if (request.query.remoteUser) {
		optional['remoteUser'] = request.query.publicUpload;
	}

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.shareFileWithUser(path, username, optional, function(error, body) {
		//response.send("path = " + body.getPath());
		response.send(error || body);
	});
});

app.get('/shareFileWithGroup', function(request, response) {
	var path = request.query.path;
	var groupName = request.query.groupName;

	var optional = {};

	if (request.query.groupName) {
		optional['perms'] = request.query.groupName;
	}

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.shareFileWithGroup(path, groupName, optional, function(error, body) {
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
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.getShares(path, optional, function(error, body) {
		//response.send("path = " + body.getPath());
		response.send(error || body);
	});
});

app.get('/isShared', function(request, response) {
	var path = request.query.path;
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.isShared(path, function(error, body) {
		//response.send("path = " + body.getPath());
		response.send(error || body);
	});
});

app.get('/getShare', function(request, response) {
	var shareId = request.query.shareId;
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.getShare(shareId, function(error, body) {
		//response.send("path = " + body.getPath());
		response.send(error || body);
	});
});

app.get('/listOpenRemoteShare', function(request, response) {
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.listOpenRemoteShare(function (error, body) {
		response.send(error || body);
	});
});

app.get('/acceptRemoteShare', function(request, response) {
	var shareId = request.query.shareId;
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.acceptRemoteShare(shareId, function (error, body) {
		response.send(error || body);
	});
});

app.get('/declineRemoteShare', function(request, response) {
	var shareId = request.query.shareId;
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.declineRemoteShare(shareId, function (error, body) {
		response.send(error || body);
	});
});

app.get('/deleteShare', function(request, response) {
	var shareId = request.query.shareId;
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.deleteShare(shareId, function (error, body) {
		response.send(error || body);
	});
});

/////////////////////////////////////
///////    USER MANAGEMENT    ///////
/////////////////////////////////////

app.get('/createUser', function(request, response) {
	var uname = request.query.username;
	var pass = request.query.password;
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.createUser(uname, pass, function (error, body) {
		response.send(error || body);
	});
});

app.get('/deleteUser', function(request, response) {
	var uname = request.query.username;
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.deleteUser(uname, function (error, body) {
		response.send(error || body);
	});
});

app.get('/searchUsers', function(request, response) {
	var username = request.query.username;
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.searchUsers(username, function (error, body) {
		response.send(error || body);
	});
});

app.get('/userExists', function(request, response) {
	var username = request.query.username;
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.userExists(username, function(error, body) {
		response.send(error || body);
	});
});

app.get('/getUsers', function(request, response) {
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.getUsers(function(error, body) {
		response.send(error || body);
	});
});

app.get('/setUserAttribute', function(request, response) {
	var username = request.query.username;
	var key = request.query.key;
	var value = request.query.value;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.setUserAttribute(username, key, value, function(error, body) {
		response.send(error || body);
	});
});

app.get('/addUserToGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.addUserToGroup(username, groupName, function(error, body) {
		response.send(error || body);
	});
});

app.get('/getUserGroups', function(request, response) {
	var username = request.query.username;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.getUserGroups(username, function(error, body) {
		response.send(error || body);
	});
});

app.get('/userIsInGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.userIsInGroup(username, groupName, function(error, body) {
		response.send(error || body);
	});
});

app.get('/getUser', function(request, response) {
	var username = request.query.username;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.getUser(username, function(error, body) {
		response.send(error || body);
	});
});

app.get('/removeUserFromGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.removeUserFromGroup(username, groupName, function(error, body) {
		response.send(error || body);
	});
});

app.get('/addUserToSubadminGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.addUserToSubadminGroup(username, groupName, function(error, body) {
		response.send(error || body);
	});
});

app.get('/getUserSubadminGroups', function(request, response) {
	var username = request.query.username;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.getUserSubadminGroups(username, function(error, body) {
		response.send(error || body);
	});
});

app.get('/userIsInSubadminGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.userIsInSubadminGroup(username, groupName, function(error, body) {
		response.send(error || body);
	});
});

//////////////////////////////////////
///////    GROUP MANAGEMENT    ///////
//////////////////////////////////////

app.get('/createGroup', function(request, response) {
	var groupName = request.query.groupName;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.createGroup(groupName, function (error, body) {
		response.send(error || body);
	});
});

app.get('/deleteGroup', function(request, response) {
	var groupName = request.query.groupName;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.deleteGroup(groupName, function (error, body) {
		response.send(error || body);
	});
});

app.get('/getGroups', function(request, response) {
	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.getGroups(function (error, body) {
		response.send(error || body);
	});
});

app.get('/getGroupMembers', function(request, response) {
	var groupName = request.query.groupName;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.getGroupMembers(groupName, function (error, body) {
		response.send(error || body);
	});
});

app.get('/groupExists', function(request, response) {
	var groupName = request.query.groupName;

	if (!oc) {
		oc = new owncloud('');
		oc.login('', '', function(error, body) {
			//response.send(error || body);
		});
	}
	oc.groupExists(groupName, function (error, body) {
		response.send(error || body);
	});
});

var port = process.env.PORT || 8080
var server = app.listen(port, function() {
	console.log("Swagger documentation here : http://localhost:8080/");
	console.log("Caution : Don't close the process until you're done experimenting with the documentation!");
});