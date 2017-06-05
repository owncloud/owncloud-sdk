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
};

files.prototype.putFileContents = function(path, content) {
	return new Promise((resolve, reject) => {
		helpers._makeDAVrequest('PUT', path, null, content).then(status => {
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

files.prototype.getFile = function(path, localPath) {
	path = helpers._normalizePath(path);
	localPath = localPath || __dirname + path;
	path = helpers._encodeString(path);
	path = encodeURIComponent(path);
	path = path.split('%2F').join('/');

	return new Promise((resolve, reject) => {
		helpers._writeData(helpers._webdavUrl + path, localPath)
		.then(status => {
			resolve(status);
		}).catch(error => {
			reject(error);
		});
	});
};

files.prototype.getDirectoryAsZip = function(path, localPath) {
	path = helpers._normalizePath(path);
	localPath = localPath || __dirname + path;
	localPath = helpers._checkExtensionZip(localPath);
	path = helpers._encodeString(path);
	path = encodeURIComponent(path);
	path = path.split('%2F').join('/');

	var url = helpers.instance + 'index.php/apps/files/ajax/download.php?dir=' + (path);
	
	return new Promise((resolve, reject) => {
		helpers._writeData(url, localPath)
		.then(status => {
			resolve(status);
		}).catch(error => {
			reject(error);
		});
	});
};

files.prototype.putFile = function(path, localPath, keepMTime) {
	keepMTime = keepMTime || true;
	var headers = {};

	if (!path || path === '' || path === '/') {
		path = localPath;
	}
	
	if (keepMTime) {
		headers['X-OC-MTIME'] = helpers._getMTime(localPath);
	}

	headers['Content-Length'] = helpers._getFileSize(localPath);
	headers.authorization = "Basic " + new Buffer(helpers._username + ":" + helpers._password).toString('base64');

	return new Promise((resolve,reject) => {	
		helpers._readFile(path, localPath, headers).then(status => {
			resolve(status);
		}).catch(error => {
			reject(error);
		});
	});
};

files.prototype.putDirectory = function(targetPath, localPath) {
	/* jshint unused : false */
	var self = this;
	
	var filesToPut = helpers._getAllFileInfo(localPath, targetPath);
	var folderPromises = [];
	var allFiles = 0;
	var count = 0;

	for (var i=0;i<filesToPut.length;i++) {
		allFiles += filesToPut[i].files.length;
		var folder = filesToPut[i].path;

		if (folderPromises.length > 0) {	
			Promise.all(folderPromises).then(status => {
				folderPromises.push(self.mkdir(folder));
			});
		}
		else {
			folderPromises.push(self.mkdir(folder));
		}
	}

	return new Promise((resolve, reject) => {
		Promise.all(folderPromises).then(status => {
			for (var i=0;i<filesToPut.length;i++) {
				var folder = filesToPut[i].path;

				for (var j=0;j<filesToPut[i].files.length;j++) {
					self.putFile(
						folder + filesToPut[i].files[j], 
						filesToPut[i].localPath + filesToPut[i].files[j]
					).then(status2 => {
						if (status2 === true) {
							count++;
						}

						if (count === allFiles) {
							resolve(true);
						}
					}).catch(error => {
						reject(error);
						return;
					});
				}
			}
		}).catch(error => {
			reject(error);
			return;
		});
	});
	/* jshint unused : true */
};

files.prototype.move = function(source, target) {
	return new Promise((resolve, reject) => {
		helpers._webdavMoveCopy(source, target, 'MOVE').then(status => {
			resolve(status);
		}).catch(error => {
			reject(error);
		});
	});
};

files.prototype.copy = function(source, target) {
	return new Promise((resolve, reject) => {
		helpers._webdavMoveCopy(source, target, 'COPY').then(status => {
			resolve(status);
		}).catch(error => {
			reject(error);
		});
	});
};

module.exports = files;