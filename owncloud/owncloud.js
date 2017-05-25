var request = require('request');
var parser = require('xml2json');
var shareInfo = require('./shareInfo.js');
var utf8 = require('utf8');
var querystring = require('querystring');
var Promise = require('es6-promise').Promise;

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
 *
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

/////////////////////////////
///////    GENERAL    ///////
/////////////////////////////

/**
 * Logs in to the specified ownCloud instance (Updates capabilities)
 * @param {string} 		username 	name of the user to login
 * @param {string} 		password 	password of the user to login
 * @param {Function} 	callback 	error, body(boolean)
 */
ownCloud.prototype.login = function(username, password) {
	this._username = username;
	this._password = password;
	var self = this;
	
	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		self._updateCapabilities()
		.then(body => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
	/* jshint unused: true */
};

/**
 * Returns ownCloud config information
 * @param  {Function} callback error, body(object : {"version" : "1.7", "website" : "ownCloud" etc...})
 */
ownCloud.prototype.getConfig = function() {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', '', 'config')
		.then(data => {
			var tree = parser.toJson(data.body, {object: true});
			resolve(tree.ocs.data);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Gets the ownCloud version of the connected server
 * @param {Function}  callback  error, body(string : version)
 */
ownCloud.prototype.getVersion = function() {
	var self = this;

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		if (self._version === null) {
			self._updateCapabilities()
			.then(body => {
				resolve(self._version);
			}).catch(error => {
				reject(error);
			});
		}
		else {
			resolve(self._version);
		}
	});
};

/**
 * Gets the ownCloud app capabilities
 * @param {Function}  callback 	error, body(object containing capabilities)
 */
ownCloud.prototype.getCapabilities = function() {
	var self = this;

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		if (self._capabilities === null) {
			self._updateCapabilities()
			.then(body => {
				resolve(self._capabilities);
			}).catch(error => {
				reject(error);
			});
		}
		else {
			resolve(self._capabilities);
		}
	});
};

///////////////////////////////////
///////    APP MANGEMENT    ///////
///////////////////////////////////

/**
 * Gets all enabled and non-enabled apps downloaded on the instance.
 * @param {Function} 	callback 	 error, body(apps)
 */
ownCloud.prototype.getApps = function() {
	var self = this;
	var send = {};

	var allAppsP = this._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "apps");
	var allEnabledAppsP = self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "apps?filter=enabled");

	return new Promise((resolve, reject) => {
		Promise.all([allAppsP, allEnabledAppsP])
		.then(apps => {
			var statuscode = parseInt(this._checkOCSstatusCode(parser.toJson(apps[0].body, {object: true})));
			if (statuscode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var allApps = parser.toJson(apps[0].body, {object: true}).ocs.data.apps.element;
			var allEnabledApps = parser.toJson(apps[1].body, {object: true}).ocs.data.apps.element;

			for (var i=0;i<allApps.length;i++) {
				send[allApps[i]] = false;
			}
			for (i=0;i<allEnabledApps.length;i++) {
				send[allEnabledApps[i]] = true;
			}

			resolve(send);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Returns an application attribute
 * @param  {string}   app      application ID (Generally app-name)
 * @param  {string}   key      attribute key or None to retrieve all values for the given application
 * @param  {Function} callback error, body(object {key1 : value1, key2 : value2 etc...})
 */
ownCloud.prototype.getAttribute = function(app, key) {
	var self = this;

	var send = "getattribute";
	if (app) {
		send += '/' + encodeURIComponent(app);

		if (key) {
			send += '/' + encodeURIComponent(this._encodeString(key));
		}
	}

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', this.OCS_SERVICE_PRIVATEDATA, send)
		.then(data => {

			var elements = parser.toJson(data.body, {object: true}).ocs.data.element;

			if (key) {
				if (!elements) {
					resolve(null);
				}
				else {
					var value = elements.value;
					elements.value = Object.keys(value).length === 0 && value.constructor === Object ? '' : value;
					resolve(elements.value);
				}
			}
			else {
				if (!elements) {
					resolve({});
					return;
				}
				if (elements.constructor !== Array) {
					elements = [ elements ];
				}
				var allAttributes = {};
				for (var i=0;i<elements.length;i++) {
					allAttributes[elements[i].key] = elements[i].value;
				}
				resolve(allAttributes);
			}
		})
		.catch(error => {
			reject(error);
		});
	});
};

/**
 * Sets an application attribute
 * @param  {string}   app      application ID (Generally app-name)
 * @param  {string}   key      attribute key or None to retrieve all values for the given application
 * @param  {string}   value    value to set of given attribute
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.setAttribute = function(app, key, value) {
	var self = this;
	var path = "setattribute/" + encodeURIComponent(app) + '/' + encodeURIComponent(this._encodeString(key));

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_PRIVATEDATA, path, 
		{'value' : self._encodeString(value)})
		.then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Deletes an application attribute
 * @param  {string}   app      application ID (generally app-name)
 * @param  {string}   key      attribute key to delete for the given application
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.deleteAttribute = function(app, key) {
	var self = this;
	var path = 'deleteattribute/' + encodeURIComponent(app) + '/' + encodeURIComponent(self._encodeString(key));

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_PRIVATEDATA, path)
		.then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * enables an app via the Provisioning API
 * @param  {string}   appname  name of the app to be enabled
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.enableApp = function(appname) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', this.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname))
		.then(data => {
			if (!data.body) {
				reject("No app found by the name \"" + appname + "\"");
			}
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * disables an app via the Provisioning API
 * @param  {string}   appname  name of the app to be disabled
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.disableApp = function(appname) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('DELETE', this.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname))
		.then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/////////////////////////////
///////    SHARING    ///////
/////////////////////////////

/**
 * Shares a remote file with specified user
 * @param {string} 		path 					path to the remote file share
 * @param {string}  	[perms = 1]					permission of the shared object defaults to read only (1)
 * @param {string}   	[publicUpload] 			allows users to upload files or folders
 * @param {string}   	[password] 				sets a password
 * @param {Function}    shareCallbackcallback 	error, body (instance of class shareInfo)
 */
ownCloud.prototype.shareFileWithLink = function(path, optionalParams) {
    path = this._normalizePath(path);
    var self = this;
    
    var postData = {
        'shareType': this.OCS_SHARE_TYPE_LINK,
        'path': this._encodeString(path)
    };

    if (optionalParams) {
	    if (optionalParams.perms) {
	    	postData.permissions = optionalParams.perms;
	    }
	    if (optionalParams.password) {
	    	postData.password = optionalParams.password;
	    }
	    if (optionalParams.publicUpload && typeof(optionalParams.publicUpload) === "boolean") {
	    	postData.publicUpload = optionalParams.publicUpload.toString().toLowerCase();
	    }
    }

    return new Promise((resolve, reject) => {
    	self._makeOCSrequest('POST', self.OCS_SERVICE_SHARE, 'shares', postData)
    	.then(data => {
    		var shareDetails = parser.toJson(data.body, {object : true}).ocs.data;
    		var share = new shareInfo(shareDetails);

    		resolve(share);
    	}).catch(error => {
    		reject(error);
    	});
    });
};

/**
 * Updates a given share
 * @param 	{integer}	  shareId		   Share ID
 * @param 	{integer}	  perms			   update permissions (see shareFileWithUser() method)
 * @param 	{string}	  password		   updated password for public link Share
 * @param 	{boolean}	  publicUpload	   enable/disable public upload for public shares
 * @param 	{Function}	  callback		   error, body(boolean)
 */
ownCloud.prototype.updateShare = function(shareId, optionalParams) {
    var postData = {};
    var self = this;

    if (optionalParams) {
	    if (optionalParams.perms) {
	    	postData.permissions = optionalParams.perms;
	    }
	    if (optionalParams.password) {
	    	postData.password = optionalParams.password;
	    }
	    if (optionalParams.publicUpload && typeof(optionalParams.publicUpload) === "boolean") {
	    	postData.publicUpload = optionalParams.publicUpload.toString().toLowerCase();
	    }
	}

    /* jshint unused: false */
    return new Promise((resolve, reject) => {
    	self._makeOCSrequest('PUT', this.OCS_SERVICE_SHARE, 
    		'shares/' + encodeURIComponent(shareId.toString()), postData
    	).then(data => {
    		resolve(true);
    	}).catch(error => {
    		reject(error);
    	});
    });
};

/**
 * Shares a remote file with specified user
 * @param {string} 				path 				path to the remote file share
 * @param {string} 				username    		name of user to share file/folder with
 * @param {string}  			[perms = 1]			permission of the shared object defaults to read only (1)
 * @param {boolean}  			[remoteUser] 		user is remote or not
 * @param {Function}            shareCallback 		error, body (instance of class shareInfo)
 */
ownCloud.prototype.shareFileWithUser = function(path, username, optionalParams) {
    path = this._normalizePath(path);
    var self = this;
    
    var postData = {
        'shareType': this.OCS_SHARE_TYPE_USER,
        'shareWith': username,
        'path': this._encodeString(path)
    };

    if (optionalParams) {
	    if (optionalParams.perms) {
		    postData.permissions = optionalParams.perms;
	    }

	    if (optionalParams.remoteUser) {
		    postData.shareType = this.OCS_SHARE_TYPE_REMOTE;
	    }
    }

    return new Promise((resolve, reject) => {
    	self._makeOCSrequest('POST', self.OCS_SERVICE_SHARE, 'shares', postData)
    	.then(data => {
    		var shareData = parser.toJson(data.body, {object: true}).ocs.data;

    		var share = new shareInfo(shareData);
    		resolve(share);
    	}).catch(error => {
    		reject(error);
    	});
    });
};

/**
 * Shares a remote file with specified group
 * @param {string} 				path 				path to the remote file share
 * @param {string} 				groupName    		name of group to share file/folder with
 * @param {string}  			[perms = 1]			permission of the shared object defaults to read only (1)
 * @param {Function}            shareCallback 		error, body (instance of class shareInfo)
 */
ownCloud.prototype.shareFileWithGroup = function(path, groupName, optionalParams) {
	path = this._normalizePath(path);
	var self = this;
    
    var postData = {
        'shareType': this.OCS_SHARE_TYPE_GROUP,
        'shareWith': groupName,
        'path': this._encodeString(path)
    };

    if (optionalParams && optionalParams.perms) {
	    postData.permissions = optionalParams.perms;
    }

    return new Promise((resolve, reject) => {
    	self._makeOCSrequest('POST', this.OCS_SERVICE_SHARE, 'shares', postData)
    	.then(data => {
    		var shareData = parser.toJson(data.body, {object: true}).ocs.data;
    		var share = new shareInfo(shareData);
    		resolve(share);
    	}).catch(error => {
    		reject(error);
    	});
    });
};

/**
 * Returns array of shares
 * @param  {string}   path           path to the file whose share needs to be checked
 * @param  {object}   optionalParams object of values {"reshares": boolean, 
 *                                   "subfiles": boolean, "shared_with_me": boolean}
 * @param  {Function} callback       error, body(array of shareInfo objects)
 */
ownCloud.prototype.getShares = function(path, optionalParams){
    var data = 'shares';
    var self = this;
	var send = {};

    if (path !== '') {
    	data += '?';

    	send.path = this._encodeString(this._normalizePath(path));
    	optionalParams = this._convertObjectToBool(optionalParams);

    	if (optionalParams) {
    		if (optionalParams.reshares && typeof(optionalParams.reshares) === "boolean") {
    			send.reshares = optionalParams.reshares;
    		}

			if (optionalParams.subfiles && typeof(optionalParams.subfiles) === "boolean") {
    			send.subfiles = optionalParams.subfiles;
    		}

    		/*jshint camelcase: false */
    		if (optionalParams.shared_with_me && typeof(optionalParams.shared_with_me) === "boolean") {
    			send.shared_with_me = optionalParams.shared_with_me;
    		}
    		/*jshint camelcase: true */
    	}

    	var urlString = '';
    	for (var key in send) {
    		urlString += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(send[key]);
    	}
    	urlString = urlString.slice(1); // removing the first '&'

    	data += urlString;
    }

    return new Promise((resolve, reject) => {
    	self._makeOCSrequest('GET', self.OCS_SERVICE_SHARE, data)
    	.then(data => {
    		var elements = parser.toJson(data.body, {object: true}).ocs.data.element || [];
    		var shares = [];

    		if (elements && elements.constructor !== Array) {
    			// just a single element
    			elements = [ elements ];
    		}
	    	for (var i=0;i<elements.length;i++) {
	    		var share = new shareInfo(elements[i]);
	    		shares.push(share);
	    	}

	    	resolve(shares);
    	}).catch(error => {
    		reject(error);
    	});
    });
};

// PLEASE UN-COMMENT ME AFTER IMPLEMENTING "fileInfo"
/**
 * Checks wether a path is already shared
 * @param  {string}   path     path to the share to be checked
 * @param  {Function} callback error, body(boolean : true if shared, false if not)
 */
ownCloud.prototype.isShared = function(path) {
	var self = this;

	// var bod = false;
	// var err;
	
	// check if file exists (webDAV)
	return new Promise((resolve, reject) => {
		//this.fileInfo(path, function (err, res, bod) {
			//if (!err) {
				self.getShares(path)
				.then(shares => {
					resolve(shares.length > 0);
				}).catch(error => {
					reject(error);
				});
			//}
		//});
	});
};

/**
 * Gets share information about known share
 * @param  {Number}   shareId  ID of the share to be checked
 * @param  {Function} callback error, body(instance of class shareInfo)
 */
ownCloud.prototype.getShare = function(shareId) {
	var self = this;

	return new Promise((resolve, reject) => {
		if (isNaN((parseInt(shareId)))) {
			reject("share ID specified should be a number");
			return;
		}

		self._makeOCSrequest('GET', self.OCS_SERVICE_SHARE, 'shares/' + shareId.toString())
		.then(data => {
			var shareData = parser.toJson(data.body, {object: true}).ocs.data.element;
			var share = new shareInfo(shareData);

			resolve(share);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * List all pending remote share
 * @param  {Function} callback error, body(array of shares)
 */
ownCloud.prototype.listOpenRemoteShare = function() {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', self.OCS_SERVICE_SHARE, 'remote_shares/pending')
		.then(data => {
			var shares = parser.toJson(data.body, {object: true}).ocs.data.element || [];
			resolve(shares);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Accepts a remote share
 * @param  {integer}  shareId  ID of the share to accept
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.acceptRemoteShare = function(shareId) {
	var self = this;

	return new Promise((resolve, reject) => {
		if (isNaN((parseInt(shareId)))) {
			reject("Please pass a valid share ID (Integer)", null);
			return;
		}

		/* jshint unused: false */
		self._makeOCSrequest('POST', self.OCS_SERVICE_SHARE, 
			'remote_shares/pending' + encodeURIComponent(shareId.toString())
		).then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Declines a remote share
 * @param  {integer}  shareId  ID of the share to decline
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.declineRemoteShare = function(shareId) {
	var self = this;

	return new Promise((resolve, reject) => {
		if (isNaN((parseInt(shareId)))) {
			reject("Please pass a valid share ID (Integer)", null);
			return;
		}

		/* jshint unused: false */
		self._makeOCSrequest('DELETE', self.OCS_SERVICE_SHARE, 
		'remote_shares/pending' + encodeURIComponent(shareId.toString())
		).then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Deletes a share
 * @param  {integer}  shareId  ID of the share to delete
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.deleteShare = function(shareId) {
	var self = this;

	return new Promise((resolve, reject) => {
		if (isNaN((parseInt(shareId)))) {
			reject("Please pass a valid share ID (Integer)", null);
			return;
		}

		/* jshint unused: false */
		self._makeOCSrequest('DELETE', self.OCS_SERVICE_SHARE, 
			'shares/' + encodeURIComponent(shareId.toString())
		).then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

/////////////////////////////////////
///////    USER MANAGEMENT    ///////
/////////////////////////////////////

/**
 * Creates user via the provisioning API<br>
 * If user already exists, an error is given back : "User already exists"<br>
 * If provisoning API has been disabled, an error is given back saying the same.
 * @param  {string}   username username of the new user to be created
 * @param  {string}   password password of the new user to be created
 * @param  {Function} callback error, body(boolean : whether user was created or not)
 */
ownCloud.prototype.createUser = function(username, password) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 'users', 
			{'password' : password, 'userid' : username}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Deletes a user via provisioning API
 * @param  {string}   username name of user to be deleted
 * @param  {Function} callback error, body(boolean)
 */
ownCloud.prototype.deleteUser = function(username) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('DELETE', self.OCS_SERVICE_CLOUD, 'users/' + username)
		.then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Searches for users via provisioning API
 * @param  {string}   name     username of the user to be searched
 * @param  {Function} callback error, body(array of search results i.e users)
 */
ownCloud.prototype.searchUsers = function(name) {
	var self = this;
	
	var action = 'users';
	if(name) { 
		action += '?search=' + name;
	}

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', this.OCS_SERVICE_CLOUD, action)
		.then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var users = tree.ocs.data.users.element || [];
			if (users && users.constructor !== Array) {
				users = [ users ];
			}
			resolve(users);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Checks a user via provisioning API
 * @param  {string}   name     name of user to be checked
 * @param {Function} callback error, body(boolean; whether exists or not)
 */
ownCloud.prototype.userExists = function(name) {
	var self = this;
	if (!name) {
		name = '';
	}

	return new Promise((resolve, reject) => {
		self.searchUsers(name).then(users => {
			resolve(users.indexOf(name) > -1);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Get all users via Provisioning API
 * @param  {Function} callback error, body(array of all users)
 */
ownCloud.prototype.getUsers = function() {
	var self = this;

	return new Promise((resolve, reject) => {
		self.searchUsers('').then(users => {
			resolve(users);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Sets a user attribute via the Provisioning API
 * @param {string}   username name of the user to modify
 * @param {string}   key      key of the attribute to be set (email, quota, display, password)
 * @param {string}   value    value to be set
 * @param {Function} callback error, body(boolean)
 */
ownCloud.prototype.setUserAttribute = function(username, key, value) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('PUT', self.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username), 
			{'key' :   self._encodeString(key), 'value' : self._encodeString(value)}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Adds a user to group
 * @param {string}   username  name of user to be added
 * @param {string}   groupName name of group user is to be added to
 * @param {Function} callback  error, body(boolean)
 */
ownCloud.prototype.addUserToGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/groups', {'groupid' : groupName}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Get a list of groups associated to a user
 * @param  {string}   username name of user to list groups
 * @param  {Function} callback error, body(array of user groups)
 */
ownCloud.prototype.getUserGroups = function(username) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', this.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/groups'
		).then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var groups = tree.ocs.data.groups.element || [];
			if (groups && groups.constructor !== Array) {
				groups = [ groups ];
			}
			resolve(groups);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Checks whether user is in group
 * @param  {string}   username  name of user
 * @param  {string}   groupName name of group
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.userIsInGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self.getUserGroups(username).then(groups => {
			resolve(groups.indexOf(groupName) > -1);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Retrieves information about a user
 * @param  {string}   username name of the user
 * @param  {Function} callback error, body(object having details of the user)
 */
ownCloud.prototype.getUser = function(username) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username)
		).then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var userInfo = tree.ocs.data || null;
			resolve(userInfo);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Removes user from a group
 * @param  {string}   username  name of user
 * @param  {string}   groupName name of group
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.removeUserFromGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('DELETE', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/groups', {'groupid' : groupName}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Adds user to a subadmin group
 * @param {string}   username  name of user
 * @param {string}   groupName name of group
 * @param {Function} callback  error, body(boolean)
 */
ownCloud.prototype.addUserToSubadminGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/subadmins', {'groupid' : groupName}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Get a list of subadmin groups associated to a user
 * @param  {string}   username name of user
 * @param  {Function} callback error, body(array of subadmin groups)
 */
ownCloud.prototype.getUserSubadminGroups = function(username) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/subadmins'
		).then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var groups = tree.ocs.data.element || [];
			if (groups && groups.constructor !== Array) {
				groups = [ groups ];
			}
			resolve(groups);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Checks whether user is in subadmin group
 * @param  {string}   username  name of user
 * @param  {string}   groupName name of group
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.userIsInSubadminGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self.getUserSubadminGroups(username).then(groups => {
			resolve(groups.indexOf(groupName) > -1);
		}).catch(error => {
			reject(error);
		});
	});
};

//////////////////////////////////////
///////    GROUP MANAGEMENT    ///////
//////////////////////////////////////

/**
 * creates a new group
 * @param  {string}   groupName name of group to be created
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.createGroup = function(groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 'groups', {'groupid' : groupName})
		.then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * deletes an existing group
 * @param  {string}   groupName name of group to be created
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.deleteGroup = function(groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('DELETE', self.OCS_SERVICE_CLOUD, 'groups/' + groupName)
		.then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Gets all groups in the instance
 * @param  {Function} callback error, body(array of all groups)
 */
ownCloud.prototype.getGroups = function() {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 'groups')
		.then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var groups = tree.ocs.data.groups.element || [];
			if (groups && groups.constructor !== Array) {
				// single element
				groups = [ groups ];
			}
			resolve(groups);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Gets all the members of a group
 * @param  {string}   groupName name of group to list members
 * @param  {Function} callback  error, body(array of all members)
 */
ownCloud.prototype.getGroupMembers = function(groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 'groups/' + encodeURIComponent(groupName))
		.then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var groups = tree.ocs.data.users.element || [];
			if (groups && groups.constructor !== Array) {
				// single element
				groups = [ groups ];
			}
			resolve(groups);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * checks whether a group exists
 * @param  {string}   groupName name of group to check
 * @param  {Function} callback  error, body(boolean)
 */
ownCloud.prototype.groupExists = function(groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self.getGroups().then(groups => {
			resolve(groups.indexOf(groupName) > -1);
		}).catch(error => {
			reject(error);
		});
	});
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
ownCloud.prototype._updateCapabilities = function() {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "capabilities")
		.then(data => {
			var body = parser.toJson(data.body, {object: true}).ocs.data;
			self._capabilities = body.capabilities;
			self._version = body.version.string + '-' + body.version.edition;
			resolve(self._capabilities);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Makes an OCS API request.
 * @param {string} 		method 		method of request (GET, POST etc.)
 * @param {string} 		service		service (cloud, privatedata etc.)
 * @param {string} 		action		action (apps?filter=enabled, capabilities etc.)
 * @param {Function} 	callback 	error, reponse, body
 */
ownCloud.prototype._makeOCSrequest = function (method, service, action) {
	var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    var err = null;

    method = args.shift();
    service = args.shift();
    action = args.shift();
    var data;
    var self = this;

    if (args.length === 1) {
    	data = args[0];
    }

	if (!this.instance) {
		err = "Please specify a server URL first";
	}

	if (!this._username || !this._password) {
		err = "Please specify a username AND password first.";
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

	return new Promise((resolve, reject) => {
		if (err) {
			reject(err);
		}

		// Start the request
		request(options, function (error, response, body) {		 
			var validXml = self._isValidXML(body);
			var validJson = self._isValidJSON(body);
			
			if (validJson) {
				body = JSON.parse(body);
				if ("message" in body) {
					error = body.message;
				}
			}

			if (!error && !validXml) {
				error = "Please provide a valid owncloud instance";
				body = null;
			}

			if (!error) {
				var tree = parser.toJson(body, {object: true});
				error = self._checkOCSstatus(tree);
			}

	    	if (error) {
	    		reject(error);
	    	}
	    	else {
	    		resolve({response : response, body: body});
	    	}
		});
	});
};

/**
 * Checks whether a response body is valid XML 
 * @param  {string}  	body 	the response to be checked
 * @return {Boolean}      		true if valid XML, else false
 */
ownCloud.prototype._isValidXML = function(body) {
	try {
		parser.toJson(body);
	}
	catch (e) {
		return false;
	}
	return true;
};

/**
 * Checks whether a response body is valid JSON 
 * @param  {string}  	body 	the response to be checked
 * @return {Boolean}      		true if valid JSON, else false
 */
ownCloud.prototype._isValidJSON = function(body) {
	try {
		JSON.parse(body);
	}
	catch (e) {
		return false;
	}
	return true;
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

ownCloud.prototype._OCSuserResponseHandler = function(data, resolve, reject) {
	var tree = parser.toJson(data.body, {object: true});

	var statuscode = parseInt(this._checkOCSstatusCode(tree));
	if (statuscode === 999) {
		reject("Provisioning API has been disabled at your instance");
	}

	resolve(true);
};

module.exports = ownCloud;
