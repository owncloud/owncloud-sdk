//////////////////////////////////////
///////    FILES MANAGEMENT    ///////
//////////////////////////////////////

var Promise = require('promise');
var helpers;

/**
 * @class files
 * @classdesc 
 * <b><i> The files class, has all the methods for your owncloud files management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>Files Management</b>
 *         <ul>
 *         </ul>
 *     </li>
 * </ul>
 * 
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object} 		helperFile  	instance of the helpers class
 */
function files(helperFile) {
	helpers = helperFile;	
}

files.prototype.list = function (path, depth) {
	if (path[path.length - 1] !== '/') {
		path += '/';
	}

	var headersToSend = {};
	if (!isNaN((parseInt(depth))) || depth === "infinity") {
		depth = depth.toString();
		headersToSend.depth = depth;
	}

	return new Promise((resolve, reject) => {
		helpers._makeDAVrequest('PROPFIND', path, headersToSend).then(files => {
			resolve(files);
		}).catch(error => {
			reject(error);
		});
	});
};

files.prototype.getFileContents = function(path) {
	path = helpers._normalizePath(path);

	return new Promise((resolve, reject) => {
		helpers._get(helpers._webdavUrl + helpers._encodeString(path)).then(data => {
			var response = data.response;
			var body = data.body;

			if (response.statusCode === 200) {
				resolve(body);
			}
			else {
				var err = helpers._parseDAVerror(body);
				reject(err);
			}
		}).catch(error => {
			reject(error);
		});
	});

	// 09100922181 
	// 04065156156
};

files.prototype.putFileContents = function(path, content) {
	return new Promise((resolve, reject) => {
		helpers._makeDAVrequest('PUT', path, null, content).then(status => {
			console.log("created file : " + path);
			resolve(status);
		}).catch(error => {
			reject(error);
		});
	});
};

files.prototype.mkdir = function(path) {
	if (path[path.length - 1] !== '/') {
		path += '/';
	}

	return new Promise((resolve, reject) => {
		helpers._makeDAVrequest('MKCOL', path).then(status => {
			resolve(status);
		}).catch(error => {
			reject(error);
		});
	});
};

files.prototype.createFolder = function(path) {
	if (path[path.length - 1] !== '/') {
		path += '/';
	}

	return new Promise((resolve, reject) => {
		helpers._makeDAVrequest('MKCOL', path).then(status => {
			resolve(status);
		}).catch(error => {
			reject(error);
		});
	});
};

files.prototype.delete = function(path) {
	return new Promise((resolve, reject) => {
		helpers._makeDAVrequest('DELETE', path).then(status => {
			resolve(status);
		}).catch(error => {
			reject(error);
		});
	});
};

files.prototype.fileInfo = function(path) {
	return new Promise((resolve, reject) => {
		this.list(path, 0).then(fileInfo => {
			resolve(fileInfo[0]);
		}).catch(error => {
			reject(error);
		});
	});
};

module.exports = files;