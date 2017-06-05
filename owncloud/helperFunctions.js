/////////////////////////////
///////    HELPERS    ///////
/////////////////////////////

var Promise = require('promise');
var request = require('request');
var parser = require('xml2json');
var fs = require('fs');
var utf8 = require('utf8');
var fileInfo = require('./fileInfo.js');

/**
 * @class helpers
 * @classdesc 
 * <b><i>This is a class for helper functions, dont mess with this until sure!</i></b><br><br>
 * 
 * @author Noveen Sachdeva
 * @version 1.0.0
 */
function helpers() {
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

    this.instance = null;
	this._username = null;
	this._password = null;
	this._version = null;
	this._capabilities = null;
}

helpers.prototype.setInstance = function(instance) {
	this.instance = instance;
};

helpers.prototype.setUsername = function(username) {
	this._username = username;

	var instancePath = '/' + this.instance.split('/').slice(3).join('/');

	this._davPath = instancePath + 'remote.php/dav/files/' 
				  + encodeURIComponent(this._encodeString(this._username));

	this._webdavUrl = this.instance + 'remote.php/webdav';
};

helpers.prototype.setPassword = function(password) {
	this._password = password;
};

helpers.prototype.getVersion = function() {
	return this._version;
};

helpers.prototype.getCapabilities = function() {
	return this._capabilities;
};

/**
 * Updates the capabilities of user logging in.
 * @param {Function} callback error, reponse, body(capabilities)
 */
helpers.prototype._updateCapabilities = function() {
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
helpers.prototype._makeOCSrequest = function (method, service, action, data) {
	var self = this;
	var err = null;

	if (!this.instance) {
		err = "Please specify a server URL first";
	}

	if (!this._username || !this._password) {
		err = "Please specify a username AND password first.";
	}

	// Set the headers
	var headers = {
	    authorization : "Basic " + new Buffer(this._username + ":" + this._password).toString('base64'),
	    'OCS-APIREQUEST': true
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
	    headers: headers,
	};

	if (method === 'PUT' || method === 'DELETE') {
		options.headers['content-type'] = 'application/x-www-form-urlencoded';
		options.form = data;
	}

	else {
		options.headers['content-type'] = 'multipart/form-data';
		options.formData = data;
	}

	return new Promise((resolve, reject) => {
		// Start the request
		request(options, function (error, response, body) {			
			if (err) {
				reject(err);
			}
			var validXml = self._isValidXML(body);
			var validJson = self._isValidJSON(body);

			if (error) {
				error = "Please provide a valid owncloud instance";
			}

			if (validJson) {
				body = JSON.parse(body);
				if ("message" in body) {
					error = body.message;
				}
				else {
					error = "Please provide a valid owncloud instance";
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

helpers.prototype._makeDAVrequest = function (method, path, headerData, body) {
	var self = this;
	var err = null;
	
	if (!this.instance) {
		err = "Please specify a server URL first";
	}

	if (!this._username || !this._password) {
		err = "Please specify a username AND password first.";
	}
	
	path = self._normalizePath(path);
	path = encodeURIComponent(path);
	path = path.split('%2F').join('/'); // '/' => %2F
	var url = self._webdavUrl + self._encodeString(path);

	// Set the headers
	var headers = {
	    authorization : "Basic " + new Buffer(this._username + ":" + this._password).toString('base64')	
	};

	//Configure the request
	var options = {
	    url: url,
	    method: method,
	    headers: headers	
	};

	for (var key in headerData) {
		options.headers[key] = headerData[key];
	}

	options.body = body;

	return new Promise((resolve, reject) => {
		if (err) {
			reject(err);
		}

		// Start the request
		request(options, function (error, response, body) {
			if (error) {
				reject(error);
			}

			if ([200, 207].indexOf(response.statusCode) > -1) {
				self._parseDAVresponse(resolve, reject, body);
			}
			else if ([201, 204].indexOf(response.statusCode) > -1) {
				resolve(true);
			}
			else {
				var err = self._parseDAVerror(body);
				reject(err);
			}
		});
	});
};

helpers.prototype._parseDAVresponse = function(resolve, reject, body) {
	var tree = parser.toJson(body, {object: true})['d:multistatus']['d:response'];
	var items = [];

	if (tree.constructor !== Array) {
		tree = [ tree ];
	}

	for (var item=0;item<tree.length;item++) {
		items.push(this._parseDAVelement(tree[item]));
	}

	resolve(items);
};

helpers.prototype._parseDAVelement = function(item) {
	var name = item['d:href'];
	var attrs = item['d:propstat']['d:prop'];
	var fileType = name.substr(-1) === '/' ? 'dir' : 'file';

	var start = 0;
	name = name.split('/');
	for (var i=0;i<name.length;i++) {
		if (name[i] === 'webdav') {
			start = i;
			break;
		}
	}
	name.splice(0, start+1);
	name = '/' + name.join('/');

	name = decodeURIComponent(name);
	name = utf8.decode(name);

	return new fileInfo(name, fileType, attrs);
};

helpers.prototype._get = function(url) {
	var headers = {
	    authorization : "Basic " + new Buffer(this._username + ":" + this._password).toString('base64'),
	    'Content-Type': 'application/x-www-form-urlencoded'
	};

	//Configure the request
	var options = {
	    url: url,
	    method: 'GET',
	    headers: headers	
	};

	return new Promise((resolve, reject) => {
		// Start the request
		request(options, function (error, response, body) {
	    	if (error) {
	    		reject(error);
	    	}
	    	else {
	    		resolve({response : response, body: body});
	    	}
		});
	});
};

helpers.prototype._writeData = function(url, fileName) {
	var headers = {
	    authorization : "Basic " + new Buffer(this._username + ":" + this._password).toString('base64'),
	    'Content-Type': 'application/octet-stream'
	};

	//Configure the request
	var options = {
	    url: url,
	    method: 'GET',
	    headers: headers	
	};

	return new Promise((resolve, reject) => {
		var isPossible = 1;

		try {
			fs.closeSync(fs.openSync(fileName, 'w'));
		}
		catch (error) {
			isPossible = 0;
			reject(error.message);
			return;
		}

		// Start the request
		/* jshint unused : false */
		request(options, function (err, response, body) {
			if (response.statusCode === 200 && isPossible === 1) {
				resolve(true);
			}
		})
		.on('error', function(error){
			reject(error);
			return;
		})
		.pipe(fs.createWriteStream(fileName));
		/* jshint unused : true */
	});
};

helpers.prototype._readFile = function(path, localPath, headers) {
	var self = this;

	return new Promise((resolve, reject) => {
		try {
			path = self._normalizePath(path);
			path = encodeURIComponent(path);
			path = path.split('%2F').join('/'); // '/' => %2F
			var url = self._webdavUrl + self._encodeString(path);

			/* jshint unused : false */
			fs.createReadStream(localPath)
			.pipe(request.put({url: url, headers: headers}, function(error, response, body) {
				if (response.statusCode >= 400) {
					reject('not allowed');
				}
				else {
					resolve(true);
				}
			}));
			/* jshint unused : true */
		}

		catch(err) {
			reject(err);
		}
	});
};

helpers.prototype._checkExtensionZip = function(path) {
	var extension = path.slice(-4);
	if (extension !== '.zip') {
		path += '.zip';
	}
	return path;
};

helpers.prototype._parseDAVerror = function(body) {
	var tree = parser.toJson(body, {object: true});

	if (tree['d:error']['s:message']) {
		return tree['d:error']['s:message'];
	}
	return tree;
};

/**
 * Checks whether a response body is valid XML 
 * @param  {string}  	body 	the response to be checked
 * @return {Boolean}      		true if valid XML, else false
 */
helpers.prototype._isValidXML = function(body) {
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
helpers.prototype._isValidJSON = function(body) {
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
helpers.prototype._normalizePath = function (path) {
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
helpers.prototype._checkOCSstatus = function (json, acceptedCodes) {
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
helpers.prototype._checkOCSstatusCode = function (json) {
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
helpers.prototype._encodeString = function(path) {
	return utf8.encode(path);
};

/**
 * converts all of object's "true" or "false" entries to booleans
 * @param  {object} object object to be typcasted
 * @return {object} object typecasted object
 */
helpers.prototype._convertObjectToBool = function(object) {
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

helpers.prototype._OCSuserResponseHandler = function(data, resolve, reject) {
	var tree = parser.toJson(data.body, {object: true});

	var statuscode = parseInt(this._checkOCSstatusCode(tree));
	if (statuscode === 999) {
		reject("Provisioning API has been disabled at your instance");
	}

	resolve(true);
};

helpers.prototype._getAllFileInfo = function(path, pathToStore) {
	function getAllFileInfo(path, pathToStore, localPath) {
		if (path.slice(-1) !== '/') {
			path += '/';
		}

		var files = fs.readdirSync(path);

		for (var i=0;i<files.length;i++) {
			var file = files[i];
			var stat = fs.statSync(path + file);

			if (stat.isDirectory()) {
				getAllFileInfo(path + file + '/', pathToStore + file + '/', localPath + file + '/');
			}
			else {
				var baseAddr = pathToStore;
				var fl = 0;

				for (var j=0;j<filesToPut.length;j++) {
					if (filesToPut[j].path === baseAddr) {
						filesToPut[j].files.push(file);
						fl = 1;
						break;
					}
				}

				if (fl === 0) {
					var count = filesToPut.length;
					filesToPut[count] = {};
					filesToPut[count].path = baseAddr;
					filesToPut[count].localPath = localPath; ////////
					filesToPut[count].files = [ file ];
					count++;
				}
			}
		}
	}

	var filesToPut = [];
	var targetPath = pathToStore;
	var localPath = path;

	if (!targetPath || targetPath === '') {
		targetPath = '/';
	}

	targetPath = this._normalizePath(targetPath);
	var slash = '';
	if (targetPath.slice(-1) !== '/') {
		targetPath += '/';
	}
	if (localPath.slice(-1) !== '/') {
		localPath += '/';
	}
	if (targetPath.slice(0, 1) !== '/') {
		slash = '/';
	}

	var pathToAdd = localPath.split('/');
	pathToAdd = pathToAdd.filter(function(n){ return n !== ''; });
	var slash2 = '/';

	if (pathToAdd[pathToAdd.length - 1] === '.') {
		pathToAdd[pathToAdd.length - 1] = '';
		slash = '';
		slash2 = '';
	}
	
	pathToAdd = targetPath + slash + pathToAdd[pathToAdd.length - 1] + slash2;
	getAllFileInfo(path, pathToAdd, localPath);
	return filesToPut;
};

helpers.prototype._getMTime = function(path) {
	var info = fs.statSync(path);
	return info.mtime;
};

helpers.prototype._getFileSize = function(path) {
	var info = fs.statSync(path);
	return info.size;
};

helpers.prototype._webdavMoveCopy = function(source, target, method) {
	var self = this;

	return new Promise((resolve, reject) => {
		if (method !== "MOVE" && method !== "COPY") {
			reject('Please specify a valid method');
			return;
		}

		source = self._normalizePath(source);
		target = self._normalizePath(target);
		target = self._encodeString(target);
		target = encodeURIComponent(target);
		target = target.split('%2F').join('/');

		var headers = {
			'Destination' : self._webdavUrl + target
		};

		self._makeDAVrequest(method, source, headers).then(data => {
			resolve(data);
		}).catch(error => {
			reject(error);
		});
	});
};

module.exports = helpers;