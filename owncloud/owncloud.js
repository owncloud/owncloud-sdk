var request = require('request');
var parser = require('xml2json');
var shareInfo = require('./shareInfo.js');
var utf8 = require('utf8');
var querystring = require('querystring');


/**
 * @class ownCloud
 * @classdesc 
 * <b><i> The ownCloud class, where everything works!</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>General</b>
 *         <ul>
 *          <li>initLibrary</li>
 *          <li>login</li>
 *          <li>getConfig</li>
 *          <li>getVersion</li>
 *          <li>getCapabilities</li>
 *         </ul>
 *     </li><br>
 *     
 *     <li><b>Apps Management</b>
 *         <ul>
 *         	<li>getApps</li>
 *         	<li>getAttribute</li>
 *         	<li>setAttribute</li>
 *         	<li>deleteAttribute</li>
 *         	<li>enableApp</li>
 *         	<li>disableApp</li>
 *         </ul>
 *     </li><br>
 *     
 *     <li><b>Sharing</b>
 *         <ul>
 *          <li>shareFileWithLink</li>
 *          <li>updateShare</li>
 *          <li>shareFileWithUser</li>
 *          <li>shareFileWithGroup</li>
 *          <li>getShares</li>
 *          <li>isShared</li>
 *          <li>getShare</li>
 *          <li>listOpenRemoteShare</li>
 *          <li>acceptRemoteShare</li>
 *          <li>declineRemoteShare</li>
 *          <li>deleteShare</li>

 *         </ul>
 *     </li><br>
 *     
 *     <li><b>User Management</b>
 *         <ul>
 *         	<li>createUser</li>
 *          <li>deleteUser</li>
 *          <li>searchUsers</li>
 *          <li>userExists</li>
 *          <li>getUsers</li>
 *          <li>setUserAttribute</li>
 *          <li>addUserToGroup</li>
 *          <li>getUserGroups</li>
 *          <li>userIsInGroup</li>
 *          <li>getUser</li>
 *          <li>removeUserFromGroup</li>
 *          <li>addUserToSubadminGroup</li>
 *          <li>getUserSubadminGroups</li>
 *          <li>userIsInSubadminGroup</li>
 *         </ul>
 *     </li><br>
 *
 *     <li><b>Group Management</b>
 *         <ul>
 *         	<li>createGroup</li>
 *          <li>deleteGroup</li>
 *          <li>getGroups</li>
 *          <li>getGroupMembers</li>
 *          <li>groupExists</li>
 *         </ul>
 *     </li><br>
 *     
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {string} 		URL 	URL of the ownCloud instance
 */
function ownCloud(instance) {
	this._initRoutes();

	var slash = '';
	if (instance.slice(-1) !== '/') {
		slash = '/';
	}

	var http = '';
	if (instance.slice(4) !== "http") {
		http = 'http://';
	}

	this.instance = http + instance + slash;
	this._username = null;
	this._password = null;
	this._version = null;
	this._capabilities = null;
}

/**
 * Logs in to the specified ownCloud instance (Updates capabilities)
 * @param {string} 		username 	name of the user to login
 * @param {string} 		password 	password of the user to login
 * @param {Function} 	callback 	error, body(boolean)
 */
ownCloud.prototype.login = function(username, password, callback) {
	this._username = username;
	this._password = password;

	this._updateCapabilities(function (error, response, body) {
		var send = null;
		if (!error && response.statusCode == 200) {
			send = true;
		}
		if (!error) {
			// always sending null instead of undefined
			error = null;
		}

		callback(error, send);
	});
};

/**
 * Gets all enabled and non-enabled apps downloaded on the instance.
 * @param {Function} 	callback 	 error, body(apps)
 */
ownCloud.prototype.getApps = function(callback) {
	var self = this;
	var send = {};

	this._makeOCSrequest('GET', String(self.OCS_SERVICE_CLOUD), "apps", function(error, response, body) {
		if (!error) {
			var tree = parser.toJson(body, {object : true});

			body = tree.ocs.data.apps.element;

			for (var i=0;i<body.length;i++) {
				send[body[i]] = false;
			}

			self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "apps?filter=enabled", 
				function(error2, response2, body2) {
					if (!error2) {
						var tree = parser.toJson(body2, {object : true});

						body2 = tree.ocs.data.apps.element; 
						/*<ocs>
							<data>
								<apps>
									<element></element>
									<element></element> ..
								</apps>
							</data>
						</ocs>*/

						for (var i=0;i<body2.length;i++) {
							send[body2[i]] = true;
						}

						callback(error2, send);
					}

					else {
						callback(error2, body2);
					}
				}
			);
		}

		else {
			callback(error, body);
		}
	});
};

/**
 * Shares a remote file with specified user
 * @param {string} 		path 					path to the remote file share
 * @param {string}  	[perms = 1]					permission of the shared object defaults to read only (1)
 * @param {string}   	[publicUpload] 			allows users to upload files or folders
 * @param {string}   	[password] 				sets a password
 * @param {Function}    shareCallbackcallback 	error, body (instance of class shareInfo)
 */
ownCloud.prototype.shareFileWithLink = function(path, optionalParams, callback) {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    callback = args.pop();
    path = args.shift();
    path = this._normalizePath(path);
    
    var postData = {
        'shareType': this.OCS_SHARE_TYPE_LINK,
        'path': this._encodeString(path)
    };

    if (args.length == 1) {
    	optionalParams = args[0];

	    if ('perms' in optionalParams) {
		    postData['permissions'] = optionalParams['perms'];
	    }

	    if ('publicUpload' in optionalParams) {
		    postData['publicUpload'] = optionalParams['publicUpload'].toString().toLowerCase();
	    }

	    if ('password' in optionalParams) {
		    postData['password'] = optionalParams['password'].toString();
	    }
    }

    var self = this;

    this._makeOCSrequest(
        'POST',
        this.OCS_SERVICE_SHARE,
        'shares',
        postData,
        function(error, response, body) {
        	var share;

		    var tree = parser.toJson(body, {object : true});
		    
		    if (!error) {
			    error = self._checkOCSstatus(tree);
		    }
        	
        	if (!error) {
				body = tree.ocs.data;

			    share = new shareInfo(body);
			}
			callback(error, share);
        }
    );
};

/**
 * Shares a remote file with specified user
 * @param {string} 				path 				path to the remote file share
 * @param {string} 				username    		name of user to share file/folder with
 * @param {string}  			[perms = 1]			permission of the shared object defaults to read only (1)
 * @param {boolean}  			[remoteUser] 		user is remote or not
 * @param {Function}            shareCallback 		error, body (instance of class shareInfo)
 */
ownCloud.prototype.shareFileWithUser = function(path, username, optionalParams, callback) {
	var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    callback = args.pop();
    path = args.shift();
    path = this._normalizePath(path);

    username = args.shift();
    
    var postData = {
        'shareType': this.OCS_SHARE_TYPE_USER,
        'shareWith': username,
        'path': this._encodeString(path)
    };

    if (args.length == 1) {
    	optionalParams = args[0];

	    if ('perms' in optionalParams) {
		    postData['permissions'] = optionalParams['perms'];
	    }

	    if ('remoteUser' in optionalParams) {
		    postData['shareType'] = this.OCS_SHARE_TYPE_REMOTE;
	    }
    }

    var self = this;

    this._makeOCSrequest(
        'POST',
        this.OCS_SERVICE_SHARE,
        'shares',
        postData,
        function(error, response, body) {
        	var share;

		    var tree = parser.toJson(body, {object : true});
		    
		    if (!error) {
			    error = self._checkOCSstatus(tree);
		    }
        	
        	if (!error) {
				body = tree.ocs.data;

			    share = new shareInfo(body);
			}
			callback(error, share);
        }
    );
};

/**
 * Shares a remote file with specified group
 * @param {string} 				path 				path to the remote file share
 * @param {string} 				groupName    		name of group to share file/folder with
 * @param {string}  			[perms = 1]			permission of the shared object defaults to read only (1)
 * @param {Function}            shareCallback 		error, body (instance of class shareInfo)
 */
ownCloud.prototype.shareFileWithGroup = function(path, groupName, optionalParams, callback) {
	var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    callback = args.pop();
    path = args.shift();
    path = this._normalizePath(path);

    groupName = args.shift();
    
    var postData = {
        'shareType': this.OCS_SHARE_TYPE_GROUP,
        'shareWith': groupName,
        'path': this._encodeString(path)
    };

    if (args.length == 1) {
    	optionalParams = args[0];

	    if ('perms' in optionalParams) {
		    postData['permissions'] = optionalParams['perms'];
	    }
    }

    var self = this;

    this._makeOCSrequest(
        'POST',
        this.OCS_SERVICE_SHARE,
        'shares',
        postData,
        function(error, response, body) {
        	var share;

		    var tree = parser.toJson(body, {object : true});
		    
		    if (!error) {
			    error = self._checkOCSstatus(tree);
		    }
        	
        	if (!error) {
				body = tree.ocs.data;

			    share = new shareInfo(body);
			}
			callback(error, share);
        }
    );
};

/**
 * Returns array of shares
 * @param  {string}   path           path to the file whose share needs to be checked
 * @param  {object}   optionalParams object of values {"reshares": boolean, 
 *                                   "subfiles": boolean, "shared_with_me": boolean}
 * @param  {Function} callback       error, body(array of shareInfo objects)
 */
ownCloud.prototype.getShares = function(path, optionalParams, callback){
	var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    callback = args.pop();
    path = args.shift();

    if (args.length == 1) {
    	optionalParams = args[0];
    }

    var data = 'shares';

    if (path !== '') {
    	data += '?';

    	path = this._encodeString(this._normalizePath(path));
    	var send = {};
    	optionalParams = this._convertObjectToBool(optionalParams);

    	send['path'] = path;

    	if (optionalParams) {
    		if ('reshares' in optionalParams && typeof(optionalParams['reshares']) === "boolean") {
    			send['reshares'] = optionalParams['reshares'];
    		}

			if ('subfiles' in optionalParams && typeof(optionalParams['subfiles']) === "boolean") {
    			send['subfiles'] = optionalParams['subfiles'];
    		}

    		if ('shared_with_me' in optionalParams && typeof(optionalParams['shared_with_me']) === "boolean") {
    			send['shared_with_me'] = optionalParams['shared_with_me'];
    		}
    	}

    	var urlString = '';
    	for (var key in send) {
    		urlString += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(send[key]);
    	}

    	urlString = urlString.slice(1); // removing the first '&'

    	data += urlString;
    }

    var self = this;

    this._makeOCSrequest('GET', this.OCS_SERVICE_SHARE, data, function (error, response, body) {
    	var tree, elements, shares;

    	if (!error) {
	    	tree = parser.toJson(body, {object : true});
	    	elements = tree.ocs.data.element;
	    	shares = [];
	    }

    	if (!error) {
    		error = self._checkOCSstatus(tree);
    	}

    	if (!error) {
    		if (elements && typeof(elements) !== "object") {
    			// just a single element
    			elements = [elements];
    		}
	    	for (var i in elements) {
	    		var share = new shareInfo(elements[i]);
	    		shares.push(share);
	    	}
	    }
    	callback(error, shares);
    });
};

/**
 * Checks wether a path is already shared
 * @param  {string}   path     path to the share to be checked
 * @param  {Function} callback error, body(boolean : true if shared, false if not)
 */
ownCloud.prototype.isShared = function(path, callback) {
	var self = this;

	var bod = false;
	var err;

	// check if file exists (webDAV)
	//this.fileInfo(path, function (err, res, bod) {
		//if (!err) {
			self.getShares(path, function(error, shares) {
				err = error;

				if (!err) {
					bod = shares.length > 0;
				}

				callback(err, bod);
			});
		//}
	//});
};

/**
 * Gets share information about known share
 * @param  {Number}   shareId  ID of the share to be checked
 * @param  {Function} callback error, body(instance of class shareInfo)
 */
ownCloud.prototype.getShare = function(shareId, callback) {
	var self = this;

	if (isNaN((parseInt(shareId)))) {
		callback("share ID specified should be a number", null);
		return;
	}

	this._makeOCSrequest('GET', self.OCS_SERVICE_SHARE, 'shares/' + shareId.toString(), 
		function (error, response, body) {
			var shareInstance;

			if (!error && response.statusCode == 200) {
				var tree = parser.toJson(body, {object : true});
		    	var share = tree.ocs.data.element;

		    	shareInstance = new shareInfo(share);
			}

			callback(error, shareInstance);
		});
};

/**
 * Creates user via the provisioning API<br>
 * If user already exists, an error is given back : "User already exists"<br>
 * If provisoning API has been disabled, an error is given back saying the same.
 * @param  {string}   username username of the new user to be created
 * @param  {string}   password password of the new user to be created
 * @param  {Function} callback error, body(boolean : whether user was created or not)
 */
ownCloud.prototype.createUser = function(username, password, callback) {
	var self = this;

	this._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 'users', 
		{'password' : password, 'userid' : username}, function(error, response, body) {
			self._OCSuserResponseHandler(error, response, body, callback);
		}
	);
};

/**
 * Deletes a user via provisioning API
 * @param  {string}   username name of user to be deleted
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.deleteUser = function(username, callback) {
	var self = this;

	this._makeOCSrequest('DELETE', self.OCS_SERVICE_CLOUD, 'users/' + username, 
		function(error, response, body) {
			self._OCSuserResponseHandler(error, response, body, callback);
		}
	);
};

/**
 * Searches for users via provisioning API
 * @param  {string}   name     username of the user to be searched
 * @param  {Function} callback error, body(array of search results i.e users)
 */
ownCloud.prototype.searchUsers = function(name, callback) {
	action = 'users';

	if (name) {
		action += '?search=' + name;
	}

	var self = this;

	this._makeOCSrequest('GET', this.OCS_SERVICE_CLOUD, action, function(error, response, body) {
			self._OCSuserResponseHandler(error, response, body, callback);
		}
	);
};

/**
 * Checks a user via provisioning API
 * @param  {string}   name     name of user to be checked
 * @param {Function} callback error, body(boolean; whether exists or not)
 */
ownCloud.prototype.userExists = function(name, callback) {
	if (!name) {
		name = '';
	}
	this.searchUsers(name, function(error, body) {
		var ret;
		if (!error) {
			ret = body.indexOf(name) > -1;
		}
		callback(error, ret);
	});
};

/**
 * Get all users via Provisioning API
 * @param  {Function} callback error, body(array of all users)
 */
ownCloud.prototype.getUsers = function(callback) {
	this.searchUsers('', function(error, body) {
		callback(error, body);
	});
};

/**
 * Sets a user attribute via the Provisioning API
 * @param {string}   username name of the user to modify
 * @param {string}   key      key of the attribute to be set (email, quota, display, password)
 * @param {string}   value    value to be set
 * @param {Function} callback error, body(boolean)
 */
ownCloud.prototype.setUserAttribute = function(username, key, value, callback) {
	var self = this;

	this._makeOCSrequest('PUT', self.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username), 
		{
			'key' :   self._encodeString(key),
		 	'value' : self._encodeString(value)
		}, 
		function(error, response, body) {
			self._OCSuserResponseHandler(error, response, body, callback);
		}
	);
};

/**
 * Adds a user to group
 * @param {string}   username  name of user to be added
 * @param {string}   groupName name of group user is to be added to
 * @param {Function} callback  error, body(boolean)
 */
ownCloud.prototype.addUserToGroup = function(username, groupName, callback) {
	var self = this;

	this._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username) + '/groups', 
		{
			'groupid' : groupName
		}, 
		function(error, response, body) {
			self._OCSuserResponseHandler(error, response, body, callback);
		}
	);
};

/**
 * Get a list of groups associated to a user
 * @param  {string}   username name of user to list groups
 * @param  {Function} callback error, body(array of user groups)
 */
ownCloud.prototype.getUserGroups = function(username, callback) {
	var self = this;

	this._makeOCSrequest('GET', this.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username) + '/groups', 
		function(error, response, body) {
			var groups;

			if (!error && response.statusCode == 200) {
				var tree = parser.toJson(body, {object : true});
				var statusCode = self._checkOCSstatusCode(tree);

				if (statusCode == 999) {
					error = "Provisioning API has been disabled at your instance";
				}
				else {
					error = self._checkOCSstatus(tree);
				}
				
				if (!error) {
					groups = tree.ocs.data.groups.element;

					if (groups && typeof(groups) !== "object") {
						// single element
						groups = [ groups ];
					}

					if (!groups) {
						// no element, return empty array
						groups = [];
					}
				}
			}

			callback(error, groups);
		}
	);
};

/**
 * Checks whether user is in group
 * @param  {string}   username  name of user
 * @param  {string}   groupName name of group
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.userIsInGroup = function(username, groupName, callback) {
	this.getUserGroups(username, function(error, body) {
		var ret;
		if (!error) {
			ret = body.indexOf(groupName) > -1;
		}
		callback(error, ret);
	});
};

/**
 * Retrieves information about a user
 * @param  {string}   username name of the user
 * @param  {Function} callback error, body(object having details of the user)
 */
ownCloud.prototype.getUser = function(username, callback) {
	var self = this;

	this._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username), 
		function (error, response, body) {
			var info;

			if (!error && response.statusCode == 200) {
				var tree = parser.toJson(body, {object : true});
				var statusCode = self._checkOCSstatusCode(tree);

				if (statusCode == 999) {
					error = "Provisioning API has been disabled at your instance";
				}
				else {
					error = self._checkOCSstatus(tree);
				}
				
				if (!error) {
					info = tree.ocs.data;
				}
			}

			callback(error, info);
		}
	);
};

/**
 * Removes user from a group
 * @param  {string}   username  name of user
 * @param  {string}   groupName name of group
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.removeUserFromGroup = function(username, groupName, callback) {
	var self = this;

	this._makeOCSrequest('DELETE', self.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username) + '/groups',
		{
			'groupid' : groupName
		}, 
		function (error, response, body) {
			self._OCSuserResponseHandler(error, response, body, callback);
		}
	);
};

/**
 * Adds user to a subadmin group
 * @param {string}   username  name of user
 * @param {string}   groupName name of group
 * @param {Function} callback  error, body(boolean)
 */
ownCloud.prototype.addUserToSubadminGroup = function(username, groupName, callback) {
	var self = this;

	this._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username) + '/subadmins', 
		{
			'groupid' : groupName
		}, 
		function(error, response, body) {
			self._OCSuserResponseHandler(error, response, body, [100, 103], callback);
		}
	);
};

/**
 * Get a list of subadmin groups associated to a user
 * @param  {string}   username name of user
 * @param  {Function} callback error, body(array of subadmin groups)
 */
ownCloud.prototype.getUserSubadminGroups = function(username, callback) {
	var self = this;

	this._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username) + '/subadmins',
		function(error, response, body) {
			var groups;

			if (!error && response.statusCode == 200) {
				var tree = parser.toJson(body, {object : true});
				var statusCode = self._checkOCSstatusCode(tree);

				if (statusCode == 999) {
					error = "Provisioning API has been disabled at your instance";
				}
				else {
					error = self._checkOCSstatus(tree);
				}
				
				if (!error) {
					groups = tree.ocs.data.element;

					if (groups && typeof(groups) !== "object") {
						// single element
						groups = [ groups ];
					}

					if (!groups) {
						// no element, return empty array
						groups = [];
					}
				}
			}

			callback(error, groups);
		}
	);
};

/**
 * Checks whether user is in subadmin group
 * @param  {string}   username  name of user
 * @param  {string}   groupName name of group
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.userIsInSubadminGroup = function(username, groupName, callback) {
	this.getUserSubadminGroups(username, function(error, body) {
		var ret;
		if (!error) {
			ret = body.indexOf(groupName) > -1;
		}
		callback(error, ret);
	});
};

/**
 * creates a new group
 * @param  {string}   groupName name of group to be created
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.createGroup = function(groupName, callback) {
	var self = this;

	this._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 'groups', {'groupid' : groupName},
		function (error, response, body) {
			self._OCSuserResponseHandler(error, response, body, callback);
		}
	);
};

/**
 * deletes an existing group
 * @param  {string}   groupName name of group to be created
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.deleteGroup = function(groupName, callback) {
	var self = this;

	this._makeOCSrequest('DELETE', self.OCS_SERVICE_CLOUD, 'groups/' + groupName, 
		function (error, response, body) {
			self._OCSuserResponseHandler(error, response, body, callback);
		}
	);
};

/**
 * Gets all groups in the instance
 * @param  {Function} callback error, body(array of all groups)
 */
ownCloud.prototype.getGroups = function(callback) {
	var self = this;

	this._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 'groups', function (error, response, body) {
		var groups;

		if (!error && response.statusCode == 200) {
			var tree = parser.toJson(body, {object : true});
			var statusCode = self._checkOCSstatusCode(tree);

			if (statusCode == 999) {
				error = "Provisioning API has been disabled at your instance";
			}
			else {
				error = self._checkOCSstatus(tree);
			}
			
			if (!error) {
				groups = tree.ocs.data.groups.element;

				if (groups && typeof(groups) !== "object") {
					// single element
					groups = [ groups ];
				}

				if (!groups) {
					// no element, return empty array
					groups = [];
				}
			}
		}

		callback(error, groups);
	});
};

/**
 * Gets all the members of a group
 * @param  {string}   groupName name of group to list members
 * @param  {Function} callback  error, body(array of all members)
 */
ownCloud.prototype.getGroupMembers = function(groupName, callback) {
	var self = this;

	this._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 'groups/' + encodeURIComponent(groupName), 
		function (error, response, body) {
			var members;

			if (!error && response.statusCode == 200) {
				var tree = parser.toJson(body, {object : true});
				var statusCode = self._checkOCSstatusCode(tree);

				if (statusCode == 999) {
					error = "Provisioning API has been disabled at your instance";
				}
				else {
					error = self._checkOCSstatus(tree);
				}
				
				if (!error) {
					members = tree.ocs.data.users.element;

					if (members && typeof(members) !== "object") {
						// single element
						members = [ members ];
					}

					if (!members) {
						// no element, return empty array
						members = [];
					}
				}
			}

			callback(error, members);
		}
	);
};

/**
 * checks whether a group exists
 * @param  {string}   groupName name of group to check
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.groupExists = function(groupName, callback) {
	this.getGroups(function (error, body) {
		var ret;

		if (!error) {
			ret = body.indexOf(groupName) > -1;
		}

		callback(error, ret);
	});
};

/**
 * Returns ownCloud config information
 * @param  {Function} callback error, body(object : {"version" : "1.7", "website" : "ownCloud" etc...})
 */
ownCloud.prototype.getConfig = function(callback) {
	var self = this;

	this._makeOCSrequest('GET', '', 'config', function (error, response, body) {
		var ret;

		if (!error && response.statusCode == 200) {
			var tree = parser.toJson(body, {object : true});

			error = self._checkOCSstatus(tree);

			if (!error) {
				ret = tree.ocs.data;
			}
		}

		if (!error) {
			error = null;
		}

		callback(error, ret);
	});
};

/**
 * Returns an application attribute
 * @param  {string}   app      application ID (Generally app-name)
 * @param  {string}   key      attribute key or None to retrieve all values for the given application
 * @param  {Function} callback error, body(object {key1 : value1, key2 : value2 etc...})
 */
ownCloud.prototype.getAttribute = function(app, key, callback) {
	var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    callback = args.pop();
    app = args.shift();
    key = null;

    if (args.length == 1) {
    	key = args.shift();
    }

	var send = "getattribute";
	if (app) {
		send += '/' + encodeURIComponent(app);

		if (key) {
			send += '/' + encodeURIComponent(this._encodeString(key));
		}
	}

	var self = this;

	this._makeOCSrequest('GET', this.OCS_SERVICE_PRIVATEDATA, send, 
		function (error, response, body) {
			var send;
			if (!error && response.statusCode == 200) {
				var tree = parser.toJson(body, {object: true});

				error = self._checkOCSstatus(tree);

				if (!error) {
					elements = tree.ocs.data.element;

					if (!key) {
						send = {};
					}

					if (elements && elements.constructor !== Array) {
						elements = [ elements ];
					}
					for (var i in elements) {
						if (elements[i]) {
							if (Object.keys(elements[i].value).length === 0) {
								elements[i].value = '';
							}

							if (!key) {
								send[elements[i].key] = elements[i].value;
							}

							else {
								send = elements[i].value.toString();
							}
						}
					}

					error = null;
				}
			}

			callback(error, send);
		}
	);
};

/**
 * Sets an application attribute
 * @param  {string}   app      application ID (Generally app-name)
 * @param  {string}   key      attribute key or None to retrieve all values for the given application
 * @param  {string}   value    value to set of given attribute
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.setAttribute = function(app, key, value, callback) {
	var path = "setattribute/" + encodeURIComponent(app) + '/' + encodeURIComponent(this._encodeString(key));
	var self = this;

	this._makeOCSrequest('POST', self.OCS_SERVICE_PRIVATEDATA, path, 
		{
			'value' : self._encodeString(value)
		},
		function (error, response, body) {
			var status = false;
			if (!error && response.statusCode == 200) {
				var tree = parser.toJson(body, {object: true});
				error = self._checkOCSstatus(tree);

				if (!error) {
					status = true;
					error = null;
				}
			}
			callback(error, status);
		}
	);
};

/**
 * Deletes an application attribute
 * @param  {string}   app      application ID (generally app-name)
 * @param  {string}   key      attribute key to delete for the given application
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.deleteAttribute = function(app, key, callback) {
	var self = this;
	var path = 'deleteattribute/' + encodeURIComponent(app) + '/' + encodeURIComponent(self._encodeString(key));

	this._makeOCSrequest('POST', self.OCS_SERVICE_PRIVATEDATA, path, function (error, response, body) {
		var deleted;
		if (!error && response.statusCode == 200) {
			var tree = parser.toJson(body, {object: true});

			error = self._checkOCSstatus(tree);

			if (!error) {
				deleted = true;
				error = null;
			}
		}
		callback(error, deleted);
	});
};

/**
 * Gets the ownCloud version of the connected server
 * @param {Function}  callback  error, body(string : version)
 */
ownCloud.prototype.getVersion = function(callback) {
	var self = this;

	if (!(this._version)) {
		this._updateCapabilities(function (error, response, body) {
			var ret = null;
			if (!error) {
				ret = self._version;
				error = null;
			}
			callback(error, ret);
		});
	}
	else {
		callback(null, this._version);
	}
};

/**
 * Gets the ownCloud app capabilities
 * @param {Function}  callback 	error, body(object containing capabilities)
 */
ownCloud.prototype.getCapabilities = function(callback) {
	var self = this;

	if (!(this._capabilities)) {
		this._updateCapabilities(function (error, response, body) {
			var ret;
			if (!error) {
				ret = self._capabilities;
				error = null;
			}
			callback(error, ret);
		});
	}
	else {
		callback(null, this._capabilities);
	}
};

/**
 * enables an app via the Provisioning API
 * @param  {string}   appname  name of the app to be enabled
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.enableApp = function(appname, callback) {
	var self = this;

	this._makeOCSrequest('POST', this.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname),
		function (error, response, body) {
			if (body) {
				if (!error) {
					error = null;
				}
				self._OCSuserResponseHandler(error, response, body, callback);
			}
			else {
				// There is no response from the API if the queried app doesn't exist, hence returning error
				callback("No app found by the name \"" + appname + "\"", null);
			}
		}
	);
};

/**
 * disables an app via the Provisioning API
 * @param  {string}   appname  name of the app to be disabled
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.disableApp = function(appname, callback) {
	var self = this;

	this._makeOCSrequest('DELETE', this.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname),
		function (error, response, body) {
			self._OCSuserResponseHandler(error, response, body, callback);
		}
	);
};

/**
 * List all pending remote share
 * @param  {Function} callback error, body(array of shares)
 */
ownCloud.prototype.listOpenRemoteShare = function(callback) {
	var self = this;

	this._makeOCSrequest('GET', self.OCS_SERVICE_SHARE, 'remote_shares/pending', function (error, response, body) {
		var shares;

		if (!error && response.statusCode === 200) {
			var tree = parser.toJson(body, {object: true});

			error = self._checkOCSstatus(tree);

			if (!error) {
				shares = tree.ocs.data.element;
				if (!shares) {
					shares = [];
				}
			}
		}

		callback(error, shares);
	});
};

/**
 * Accepts a remote share
 * @param  {integer}  shareId  ID of the share to accept
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.acceptRemoteShare = function(shareId, callback) {
	if (!parseInt(shareId)) {
		callback("Please pass a valid share ID (Integer)", null);
		return;
	}

	var self = this;
	var ret;

	this._makeOCSrequest('POST', self.OCS_SERVICE_SHARE, 
		'remote_shares/pending' + encodeURIComponent(shareId.toString()),
		function (error, response, body) {
			if (!error && response.statusCode === 200) {
				ret = true;
			}

			callback(error, ret);
		}
	);
};

/**
 * Declines a remote share
 * @param  {integer}  shareId  ID of the share to decline
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.declineRemoteShare = function(shareId, callback) {
	if (!parseInt(shareId)) {
		callback("Please pass a valid share ID (Integer)", null);
		return;
	}

	var self = this;
	var ret;

	this._makeOCSrequest('DELETE', self.OCS_SERVICE_SHARE, 
		'remote_shares/pending' + encodeURIComponent(shareId.toString()),
		function (error, response, body) {
			if (!error && response.statusCode === 200) {
				ret = true;
			}

			callback(error, ret);
		}
	);
};

/**
 * Deletes a share
 * @param  {integer}  shareId  ID of the share to delete
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.deleteShare = function(shareId, callback) {
	if (!parseInt(shareId)) {
		callback("Please pass a valid share ID (Integer)", null);
		return;
	}

	var self = this;
	var ret;

	this._makeOCSrequest('DELETE', self.OCS_SERVICE_SHARE, 
		'shares/' + encodeURIComponent(shareId.toString()),
		function (error, response, body) {
			if (!error && response.statusCode === 200) {
				ret = true;
			}

			callback(error, ret);
		}
	);
};

/**
 * Updates a given share
 * @param 	{integer}	  shareId		   Share ID
 * @param 	{integer}	  perms			   update permissions (see shareFileWithUser() method)
 * @param 	{string}	  password		   updated password for public link Share
 * @param 	{boolean}	  publicUpload	   enable/disable public upload for public shares
 * @param 	{Function}	  callback		   error, body(boolean)
 */
ownCloud.prototype.updateShare = function(shareId, optionalParams, callback) {
	var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    callback = args.pop();
    shareId = args.shift();

    if (args.length == 1) {
    	optionalParams = args[0];
    }

    var postData = {};

    if (optionalParams.perms) {
    	postData.permissions = optionalParams.perms;
    }
    if (optionalParams.password) {
    	postData.password = optionalParams.password;
    }
    if (optionalParams.publicUpload && typeof(optionalParams.publicUpload) === "boolean") {
    	postData.publicUpload = optionalParams.publicUpload.toString().toLowerCase();
    }

    this._makeOCSrequest('PUT', this.OCS_SERVICE_SHARE, 
    	'shares/' + encodeURIComponent(shareId.toString()), postData, 
    	function (error, response, body) {
    		var ret;
    		if (!error && response.statusCode === 200) {
    			ret = true;
    		}

    		callback(error, ret);
    	}
    );
};

/////////////
// HELPERS //
/////////////

/**
 * Initializes constants of the class ownCloud
 */
ownCloud.prototype._initRoutes = function() {
	this.OCS_BASEPATH = 'ocs/v1.php/';
    this.OCS_SERVICE_SHARE = 'apps/files_sharing/api/v1';
    this.OCS_SERVICE_PRIVATEDATA = 'privatedata';
    this.OCS_SERVICE_CLOUD = 'cloud';

    // constants from lib/public/constants.php
    this.OCS_PERMISSION_READ = 1;
    this.OCS_PERMISSION_UPDATE = 2;
    this.OCS_PERMISSION_CREATE = 4;
    this.OCS_PERMISSION_DELETE = 8;
    this.OCS_PERMISSION_SHARE = 16;
    this.OCS_PERMISSION_ALL = 31;
    
    // constants from lib/public/share.php
    this.OCS_SHARE_TYPE_USER = 0;
    this.OCS_SHARE_TYPE_GROUP = 1;
    this.OCS_SHARE_TYPE_LINK = 3;
    this.OCS_SHARE_TYPE_REMOTE = 6;
};

/**
 * Updates the capabilities of user logging in.
 * @param {Function} callback error, reponse, body(capabilities)
 */
ownCloud.prototype._updateCapabilities = function(callback) {
	var self = this;
	this._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "capabilities", function(error, response, body) {
		if (!error && response.statusCode == 200) {
			var tree = parser.toJson(body, {object : true});
			error = self._checkOCSstatus(tree);

			if (!error) {
				body = tree.ocs.data;
				self._capabilities = body.capabilities;
				self._version = body.version.string + '-' + body.version.edition;
			}
		}
		callback(error, response, self._capabilities);
	});
};

/**
 * Makes an OCS API request.
 * @param {string} 		method 		method of request (GET, POST etc.)
 * @param {string} 		service		service (cloud, privatedata etc.)
 * @param {string} 		action		action (apps?filter=enabled, capabilities etc.)
 * @param {Function} 	callback 	error, reponse, body
 */
ownCloud.prototype._makeOCSrequest = function (method, service, action, callback) {
	var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    callback = args.pop();
    method = args.shift();
    service = args.shift();
    action = args.shift();
    var data;

    if (args.length == 1) {
    	data = args[0];
    }

	if (!this.instance) {
		callback("Please specify a server URL first.", null, null);
		return;
	}

	if (!this._username || !this._password) {
		callback("Please specify a username AND password first.", null, null);
		return;
	}

	// Set the headers
	var headers = {
	    authorization : "Basic " + new Buffer(this._username + ":" + this._password).toString('base64'),
	    'Content-Type': 'application/x-www-form-urlencoded'
	};

	var slash = '';
    
    if (service) {
        slash = '/';
    }

    var path = this.OCS_BASEPATH + service + slash + action;

	//Configure the request
	var options = {
	    url: this.instance + path,
	    method: method,
	    headers: headers	
	};

	if (data) {
		options.body = querystring.stringify(data);
	}

	// Start the request
	request(options, function (error, response, body) {
		// JSON / XML
		if (response) { // Will not go in if owncloud instance isn't valid
			var responseFormat = response.headers['content-type'].split(';')[0].split('/')[1];

			if (responseFormat === "json" || responseFormat === "JSON") {
				error = JSON.parse(body).message;
				body = null;
			}
	    }
        callback(error, response, body);
	});
};

/**
 * Makes sure path starts with a '/'
 * @param {string} path to the remote file share
 * @returns {string} normalized path
 */
ownCloud.prototype._normalizePath = function (path) {
	if (!path) {
		path = '';
	}

    if (path.length === 0) {
        return '/';
    }

    if (path[0] !== '/') {
        path = '/' + path;
    }
    
    return path;
};

/**
 * Checks the status code of an OCS request
 * @param {object} parsed response
 * @param {array} [acceptedCodes = [ 100 ]] array containing accepted codes
 * @returns {string} error message or NULL
 */
ownCloud.prototype._checkOCSstatus = function (json, acceptedCodes) {
	if (!acceptedCodes) {
		acceptedCodes = [100];
	}

	var meta;
	if (json.ocs) {
		meta = json.ocs.meta;
	}
	var ret;

	if (meta && acceptedCodes.indexOf(parseInt(meta.statuscode)) === -1) {
		ret = meta.message;

		if (Object.keys(meta.message).length === 0) {
			// no error message returned, return the whole message
			ret = json;
		}
	}

	return ret;
};

/**
 * Returns the status code of the xml response
 * @param  {object} xml response parsed into json
 * @return {Number} status-code
 */
ownCloud.prototype._checkOCSstatusCode = function (json) {
	if (json.ocs) {
		var meta = json.ocs.meta;
		return parseInt(meta.statuscode);
	}
	return null;
};

/**
 * Encodes the string according to UTF-8 standards
 * @param {string} path to be encoded
 * @returns {string} encoded path
 */
ownCloud.prototype._encodeString = function(path) {
	return utf8.encode(path);	
};

/**
 * converts all of object's "true" or "false" entries to booleans
 * @param  {object} object object to be typcasted
 * @return {object} object typecasted object
 */
ownCloud.prototype._convertObjectToBool = function(object) {
	if (typeof(object) !== "object") {
		return object;
	}

	for (var key in object) {
		if (object[key] === "true") {
			object[key] = true;
		} 
		if (object[key] === "false") {
			object[key] = false;
		}
	}

	return object;
};

/**
 * Used for handling the response of boolean returning OCS-User related methods
 * @param  {string}   error    error to be returned (from _makeOCSrequest)
 * @param  {object}   response response from _makeOCSrequest
 * @param  {string/object}   body     body/data from _makeOCSrequest
 * @param  {Function} callback callback to be returned
 */
ownCloud.prototype._OCSuserResponseHandler = function(error, response, body, optionalStatusCodes, callback) {
	var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    callback = args.pop();
    error = args.shift();
    response = args.shift();
    body = args.shift();
    optionalStatusCodes = null;

    if (args.length === 1) {
	    optionalStatusCodes = args.shift();
	}

	var status = false;
	var self = this;
	if (!error && response.statusCode === 200) {
		var tree = parser.toJson(body, {object : true});
		var statusCode = parseInt(self._checkOCSstatusCode(tree));

		if (statusCode === 999) {
			error = "Provisioning API has been disabled at your instance";
		}
		else {
			if (optionalStatusCodes) {
				error = self._checkOCSstatus(tree, optionalStatusCodes);
			}
			else {
				error = self._checkOCSstatus(tree);
			}
		}
		
		if (!error) {
			error = null;
			status = true;
		}
	}

	callback(error, status);
};

module.exports = ownCloud;
