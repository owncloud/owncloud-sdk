var request = require('request');
var parser = require('xml2json');
var shareInfo = require('./shareInfo.js');
var utf8 = require('utf8');
var querystring = require('querystring');

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

ownCloud.prototype.login = function(username, password, callback) {
	this._username = /*username*/'noveens';
	this._password = /*password*/'123';

	this._updateCapabilities(function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback(error, response, "Login Successful");
		}
		else {
			callback(error, response, "Login Unuccessful");
		}
	});
};

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
				callback(error, response, JSON.stringify(send));
			}
		}

		else {
			callback(error, response, body);
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
				callback(error, response, JSON.stringify(send));
			}
		}

		else {
			callback(error, response, body);
		}
	});
};

/**
 * Shares a remote file with link.
 * @param {path} path to the remote file share
 * @param {perms (optional)} permission of the shared object defaults to read only (1)
 * @param {public_upload (optional)} allows users to upload files or folders
 * @param {password (optional)} sets a password
 * @param {shareCallback} callback error, followed by response (instance of class shareInfo)
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
		    error = self._checkOcsStatus(tree);
        	
        	if (!error) {
				body = tree.ocs.data;

			    share = new shareInfo({
	                'id': body.id,
	                'path': body.path,
	                'url': body.url,
	                'token': body.token
				});

			}
			callback(error, share);
        }
    );
};

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
		callback(error, response, JSON.stringify(self._capabilities));
	});
};

/* HELPERS */
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

ownCloud.prototype._normalizePath = function (path) {
    if (path.length == 0) {
        return '/';
    }

    if (path[0] != '/') {
        path = '/' + path;
    }
    
    return path;
};

ownCloud.prototype._checkOcsStatus = function (json, acceptedCodes) {
	if (!acceptedCodes) {
		acceptedCodes = [100];
	}

	var meta = json.ocs.meta;

	if (acceptedCodes.indexOf(parseInt(meta.statuscode)) == -1) {
		return meta.message || json;
	}

	return null;
};

ownCloud.prototype._encodeString = function(path) {
	return utf8.encode(path);	
};

module.exports = ownCloud;

/**
 * This callback is displayed as a global member.
 * @callback shareCallback
 * @param {string} error
 * @param {object} instance of class shareInfo
 */