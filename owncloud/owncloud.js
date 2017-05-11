var request = require('request');
var parser = require('xml2json');
var shareInfo = require('./shareInfo.js');
var utf8 = require('utf8');
var querystring = require('querystring');


/**
 * @class
 * @classdesc ownCloud class, where everything works
 * @param {string} URL of the ownCloud instance
 */
function ownCloud(instance) {
	console.log("Inited Library");
	this.initRoutes();

	var slash = '';
	if (instance.slice(-1) !== '/') {
		slash = '/';
	}

	var http = '';
	if (instance.slice(4) !== "http") {
		http = 'http://';
	}

	this.instance = /*http + instance + slash*/'http://localhost/core/';
	this._username = '';
	this._password = '';
	this._version = '';
	this._capabilities = [];
}

/**
 * Initializes constants of the class ownCloud
 */
ownCloud.prototype.initRoutes = function() {
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
 * Logs in to the specified ownCloud instance (Updates capabilities)
 * @param {string} username
 * @param {string} password
 * @param {callback} error, body(status message)
 */
ownCloud.prototype.login = function(username, password, callback) {
	this._username = /*username*/'noveens';
	this._password = /*password*/'123';

	this._updateCapabilities(function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback(error, "Login Successful");
		}
		else {
			callback(error, "Login Unuccessful");
		}
	});
};

/**
 * Gets all enabled and non-enabled apps downloaded on the instance.
 * @param {callback} error, body(apps)
 */
ownCloud.prototype.getApps = function(callback) {
	flag = 0;
	var self = this;
	var send = {};

	this._makeOCSrequest('GET', String(self.OCS_SERVICE_CLOUD), "apps", function(error, response, body) {
		if (!error) {
			var tree = parser.toJson(body, {object : true});

			body = tree.ocs.data.apps.element;

			for (var i=0;i<body.length;i++) {
				send[body[i]] = false;
			}

			flag++;

			if (flag == 2) { // checking if both jobs (one without enable filer and one with, have completed)
				callback(error, JSON.stringify(send));
			}
		}

		else {
			callback(error, body);
		}
	});

	this._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "apps?filter=enabled", function(error, response, body) {
		if (!error) {
			var tree = parser.toJson(body, {object : true});

			body = tree.ocs.data.apps.element; 
			/*<ocs>
				<data>
					<apps>
						<element></element>
						<element></element> ..
					</apps>
				</data>
			</ocs>*/

			for (var i=0;i<body.length;i++) {
				send[body[i]] = true;
			}

			flag++;

			if (flag == 2) { // checking if both jobs (one without enable filer and one with, have completed)
				callback(error, JSON.stringify(send));
			}
		}

		else {
			callback(error, body);
		}
	});
};

/**
 * Shares a remote file with link.
 * @param {path} path to the remote file share
 * @param {perms (optional)} permission of the shared object defaults to read only (1)
 * @param {public_upload (optional)} allows users to upload files or folders
 * @param {password (optional)} sets a password
 * @param {shareCallback} callback error, body (instance of class shareInfo)
 */
ownCloud.prototype.shareFileWithLink = function(path, optionalParams, callback) {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    callback = args.pop();
    path = args.shift();
    var optionalParams;
    var perms, publicUpload, password;
    if (args.length == 1) {
    	optionalParams = args[0];

	    if (optionalParams.indexOf('perms') > -1) {
		    perms = optionalParams.perms;
	    }

	    if (optionalParams.indexOf('publicUpload') > -1) {
		    perms = optionalParams.publicUpload;
	    }

	    if (optionalParams.indexOf('password') > -1) {
		    perms = optionalParams.password;
	    }
    }

    path = this._normalizePath(path);
    var postData = {
        'shareType': this.OCS_SHARE_TYPE_LINK,
        'path': this._encodeString(path)
    };

    if (publicUpload && (typeof(publicUpload) === "boolean")) {
        postData['publicUpload'] = publicUpload.toString().toLowerCase();
    }

    if (password) {
	    postData['password'] = password.toString();
    }
    
    if (perms) {
        postData['permissions'] = perms;
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
 * @param  {string}   path           path to the share to be checked
 * @param  {object}   optionalParams object of values {"reshares": boolean, "subfiles": boolean, "shared_with_me": boolean}
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

    	send.path = path;

    	if (optionalParams) {
    		if (optionalParams.reshares && typeof(optionalParams.reshares) === "boolean") {
    			send.reshares = optionalParams.reshares;
    		}

			if (optionalParams.subfiles && typeof(optionalParams.subfiles) === "boolean") {
    			send.subfiles = optionalParams.subfiles;
    		}

    		if (optionalParams.shared_with_me && typeof(optionalParams.shared_with_me) === "boolean") {
    			send.shared_with_me = optionalParams.shared_with_me;
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
 * @param  {Number} {string}   shareId  id of the share to be checked
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

/////////////
// HELPERS //
/////////////

/**
 * Updates the capabilities of user logging in.
 * @param {callback} error, reponse, body(capabilities)
 */
ownCloud.prototype._updateCapabilities = function(callback) {
	var self = this;
	this._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "capabilities", function(error, response, body) {
		if (!error && response.statusCode == 200) {
			var tree = parser.toJson(body, {object : true});
			body = tree.ocs.data;
			for (var app in body.capabilities) {
				self._capabilities.push(app);
			}
			self._version = body.version.string + '-' + body.version.edition;
		}
		callback(error, JSON.stringify(self._capabilities));
	});
};

/**
 * Makes an OCS API request.
 * @param {string} method of request (GET, POST etc.)
 * @param {string} service (cloud, privatedata etc.)
 * @param {string} action (apps?filter=enabled, capabilities etc.)
 * @param {callback} error, reponse, body
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
        slash = '/'
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
        callback(error, response, body);
	});
};

/**
 * Makes sure path starts with a '/'
 * @param {string} path to the remote file share
 * @returns {string} normalized path
 */
ownCloud.prototype._normalizePath = function (path) {
    if (path.length == 0) {
        return '/';
    }

    if (path[0] != '/') {
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

	var meta = json.ocs.meta;

	if (acceptedCodes.indexOf(parseInt(meta.statuscode)) == -1) {
		return meta.message || JSON.stringify(json);
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

module.exports = ownCloud;
