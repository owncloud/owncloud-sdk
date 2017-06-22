////////////////////////////////////////////////////////
///////    This is a test-server for swagger.    ///////
////////////////////////////////////////////////////////

var express  = require("express");
var owncloud = require("../../js-owncloud-client");
var configs  = require("../swagger.config.js");
var cors 	 = require('cors');
var app 	 = express();

var oc = new owncloud(configs.owncloudURL);
oc.login(configs.username, configs.password);

app.use(express.static('docs-swagger/api/swagger'));
app.use(express.static('api/swagger'));
app.use(cors());


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
	
	oc.getConfig().then(result => {
		response.send(result);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getVersion', function(request, response) {
	
	oc.getVersion().then(result => {
		response.send(result);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getCapabilities', function(request, response) {
	
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
	
	oc.apps.getApps().then(apps => {
		response.send(apps);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getAttribute', function(request, response) {
	var app = request.query.app;
	var key = request.query.key;

	
	oc.apps.getAttribute(app, key).then(attr => {
		response.send(attr);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/setAttribute', function(request, response) {
	var app = request.query.app;
	var key = request.query.key;
	var value = request.query.value || '';

	
	oc.apps.setAttribute(app, key, value).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/deleteAttribute', function(request, response) {
	var app = request.query.app;
	var key = request.query.key;

	
	oc.apps.deleteAttribute(app, key).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/enableApp', function(request, response) {
	var appname = request.query.appname;
	
	
	oc.apps.enableApp(appname).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/disableApp', function(request, response) {
	var appname = request.query.appname;
	
	
	oc.apps.disableApp(appname).then(status => {
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
		optional.perms = request.query.perms;
	}
	if (request.query.publicUpload) {
		optional.publicUpload = request.query.publicUpload;
	}
	if (request.query.password) {
		optional.password = request.query.password;
	}

	
	oc.shares.shareFileWithLink(path, optional).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/updateShare', function(request, response) {
	var shareId = request.query.shareId;
	var optional = {};

	if (request.query.perms) {
		optional.perms = request.query.perms;
	}
	if (request.query.publicUpload) {
		optional.publicUpload = request.query.publicUpload;
	}
	if (request.query.password) {
		optional.password = request.query.password;
	}

	
	oc.shares.updateShare(shareId, optional).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/shareFileWithUser', function(request, response) {
	var path = request.query.path;
	var username = request.query.username;
	var optional = {};

	if (request.query.perms) {
		optional.perms = request.query.perms;
	}
	if (request.query.remoteUser) {
		optional.remoteUser = request.query.publicUpload;
	}

	
	oc.shares.shareFileWithUser(path, username, optional).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/shareFileWithGroup', function(request, response) {
	var path = request.query.path;
	var groupName = request.query.groupName;
	var optional = {};

	if (request.query.groupName) {
		optional.perms = request.query.groupName;
	}

	
	oc.shares.shareFileWithGroup(path, groupName, optional).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getShares', function(request, response) {
	var path = request.query.path;
	var optional = {};

	if (request.query.reshares) {
		optional.reshares = request.query.reshares;
	}
	if (request.query.subfiles) { 
		optional.subfiles = request.query.subfiles;
	}
	/*jshint camelcase: false */
	if (request.query.shared_with_me) {
		optional.shared_with_me = request.query.shared_with_me;
	}
	/*jshint camelcase: true */

	
	oc.shares.getShares(path, optional).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/isShared', function(request, response) {
	var path = request.query.path;
	
	
	oc.shares.isShared(path).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getShare', function(request, response) {
	var shareId = request.query.shareId;
	
	
	oc.shares.getShare(shareId).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/listOpenRemoteShare', function(request, response) {
	
	oc.shares.listOpenRemoteShare().then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/acceptRemoteShare', function(request, response) {
	var shareId = request.query.shareId;
	
	
	oc.shares.acceptRemoteShare(shareId).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/declineRemoteShare', function(request, response) {
	var shareId = request.query.shareId;
	
	
	oc.shares.declineRemoteShare(shareId).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/deleteShare', function(request, response) {
	var shareId = request.query.shareId;
	
	
	oc.shares.deleteShare(shareId).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

/////////////////////////////////////
///////    USER MANAGEMENT    ///////
/////////////////////////////////////

app.get('/createUser', function(request, response) {
	var uname = request.query.username;
	var pass = request.query.password;
	
	
	oc.users.createUser(uname, pass).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/deleteUser', function(request, response) {
	var username = request.query.username;
	
	
	oc.users.deleteUser(username).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/searchUsers', function(request, response) {
	var username = request.query.username;
	
	
	oc.users.searchUsers(username).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/userExists', function(request, response) {
	var username = request.query.username;
	
	
	oc.users.userExists(username).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getUsers', function(request, response) {
	
	oc.users.getUsers().then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/setUserAttribute', function(request, response) {
	var username = request.query.username;
	var key = request.query.key;
	var value = request.query.value;

	
	oc.users.setUserAttribute(username, key, value).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/addUserToGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	
	oc.users.addUserToGroup(username, groupName).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getUserGroups', function(request, response) {
	var username = request.query.username;

	
	oc.users.getUserGroups(username).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/userIsInGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	
	oc.users.userIsInGroup(username, groupName).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getUser', function(request, response) {
	var username = request.query.username;

	
	oc.users.getUser(username).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/removeUserFromGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	
	oc.users.removeUserFromGroup(username, groupName).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/addUserToSubadminGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	
	oc.users.addUserToSubadminGroup(username, groupName).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getUserSubadminGroups', function(request, response) {
	var username = request.query.username;

	
	oc.users.getUserSubadminGroups(username).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/userIsInSubadminGroup', function(request, response) {
	var username = request.query.username;
	var groupName = request.query.groupName;

	
	oc.users.userIsInSubadminGroup(username, groupName).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

//////////////////////////////////////
///////    GROUP MANAGEMENT    ///////
//////////////////////////////////////

app.get('/createGroup', function(request, response) {
	var groupName = request.query.groupName;

	
	oc.groups.createGroup(groupName).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/deleteGroup', function(request, response) {
	var groupName = request.query.groupName;

	
	oc.groups.deleteGroup(groupName).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getGroups', function(request, response) {
	
	oc.groups.getGroups().then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getGroupMembers', function(request, response) {
	var groupName = request.query.groupName;

	
	oc.groups.getGroupMembers(groupName).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/groupExists', function(request, response) {
	var groupName = request.query.groupName;

	
	oc.groups.groupExists(groupName).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

//////////////////////////////////////
///////    FILES MANAGEMENT    ///////
//////////////////////////////////////

app.get('/list', function(request, response) {
	var path = request.query.remotePath || '/';
	var depth = request.query.depth;

	
	oc.files.list(path, depth).then(files => {
		response.send(files);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getFileContents', function(request, response) {
	var remotePath = request.query.remotePath;

	
	oc.files.getFileContents(remotePath).then(content => {
		response.send(content);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/putFileContents', function(request, response) {
	var remotePath = request.query.remotePath;
	var content = request.query.content;

	
	oc.files.putFileContents(remotePath, content).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/mkdir', function(request, response) {
	var remotePath = request.query.remotePath;

	
	oc.files.mkdir(remotePath).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/delete', function(request, response) {
	var remotePath = request.query.remotePath;

	
	oc.files.delete(remotePath).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/fileInfo', function(request, response) {
	var remotePath = request.query.remotePath;

	
	oc.files.fileInfo(remotePath).then(info => {
		response.send(info);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getFile', function(request, response) {
	var remotePath = request.query.remotePath;
	var localPath = request.query.localPath;

	
	oc.files.getFile(remotePath, localPath).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/getDirectoryAsZip', function(request, response) {
	var remotePath = request.query.remotePath;
	var localPath = request.query.localPath;

	
	oc.files.getDirectoryAsZip(remotePath, localPath).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/putFile', function(request, response) {
	var remotePath = request.query.remotePath;
	var localPath = request.query.localPath;
	var keepMTime = request.query.keepMTime;

	
	oc.files.putFile(remotePath, localPath, keepMTime).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/putDirectory', function(request, response) {
	var remotePath = request.query.remotePath;
	var localPath = request.query.localPath;

	
	oc.files.putDirectory(remotePath, localPath).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/move', function(request, response) {
	var source = request.query.source;
	var target = request.query.target;

	
	oc.files.move(source, target).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

app.get('/copy', function(request, response) {
	var source = request.query.source;
	var target = request.query.target;

	
	oc.files.copy(source, target).then(status => {
		response.send(status);
	}).catch(error => {
		response.send(error);
	});
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log("Swagger documentation here : http://localhost:8080/");
	console.log("Caution : Don't close the process until you're done experimenting with the documentation!");
});