/////////////////////////////
///////    SHARING    ///////
/////////////////////////////

var Promise = require('es6-promise').Promise;
var parser = require('xml2json');
var shareInfo = require('./shareInfo.js');
var helpers;

/**
 * @class shares
 * @classdesc 
 * <b><i> The shares class, has all the methods for share management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>Share Management</b>
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
 *     </li>
 * </ul>
 * 
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object} 		helperFile  	instance of the helpers class
 */
function shares(helperFile) {
	helpers = helperFile;
}

/**
 * Shares a remote file with specified user
 * @param {string} 		path 					path to the remote file share
 * @param {string}  	[perms = 1]					permission of the shared object defaults to read only (1)
 * @param {string}   	[publicUpload] 			allows users to upload files or folders
 * @param {string}   	[password] 				sets a password
 * @param {Function}    shareCallbackcallback 	error, body (instance of class shareInfo)
 */
shares.prototype.shareFileWithLink = function(path, optionalParams) {
    path = helpers._normalizePath(path);
    
    var postData = {
        'shareType': helpers.OCS_SHARE_TYPE_LINK,
        'path': helpers._encodeString(path)
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
    	helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 'shares', postData)
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
shares.prototype.updateShare = function(shareId, optionalParams) {
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
    	helpers._makeOCSrequest('PUT', helpers.OCS_SERVICE_SHARE, 
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
shares.prototype.shareFileWithUser = function(path, username, optionalParams) {
    path = helpers._normalizePath(path);
    
    var postData = {
        'shareType': helpers.OCS_SHARE_TYPE_USER,
        'shareWith': username,
        'path': helpers._encodeString(path)
    };

    if (optionalParams) {
	    if (optionalParams.perms) {
		    postData.permissions = optionalParams.perms;
	    }

	    if (optionalParams.remoteUser) {
		    postData.shareType = helpers.OCS_SHARE_TYPE_REMOTE;
	    }
    }

    return new Promise((resolve, reject) => {
    	helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 'shares', postData)
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
shares.prototype.shareFileWithGroup = function(path, groupName, optionalParams) {
	path = helpers._normalizePath(path);
    
    var postData = {
        'shareType': helpers.OCS_SHARE_TYPE_GROUP,
        'shareWith': groupName,
        'path': helpers._encodeString(path)
    };

    if (optionalParams && optionalParams.perms) {
	    postData.permissions = optionalParams.perms;
    }

    return new Promise((resolve, reject) => {
    	helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 'shares', postData)
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
shares.prototype.getShares = function(path, optionalParams){
    var data = 'shares';
	var send = {};

    if (path !== '') {
    	data += '?';

    	send.path = helpers._encodeString(helpers._normalizePath(path));
    	optionalParams = helpers._convertObjectToBool(optionalParams);

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
    	helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_SHARE, data)
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
shares.prototype.isShared = function(path) {
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
shares.prototype.getShare = function(shareId) {
	return new Promise((resolve, reject) => {
		if (isNaN((parseInt(shareId)))) {
			reject("share ID specified should be a number");
			return;
		}

		helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_SHARE, 'shares/' + shareId.toString())
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
shares.prototype.listOpenRemoteShare = function() {
	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_SHARE, 'remote_shares/pending')
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
shares.prototype.acceptRemoteShare = function(shareId) {
	return new Promise((resolve, reject) => {
		if (isNaN((parseInt(shareId)))) {
			reject("Please pass a valid share ID (Integer)", null);
			return;
		}

		/* jshint unused: false */
		helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 
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
shares.prototype.declineRemoteShare = function(shareId) {
	return new Promise((resolve, reject) => {
		if (isNaN((parseInt(shareId)))) {
			reject("Please pass a valid share ID (Integer)", null);
			return;
		}

		/* jshint unused: false */
		helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_SHARE, 
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
shares.prototype.deleteShare = function(shareId) {
	return new Promise((resolve, reject) => {
		if (isNaN((parseInt(shareId)))) {
			reject("Please pass a valid share ID (Integer)", null);
			return;
		}

		/* jshint unused: false */
		helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_SHARE, 
			'shares/' + encodeURIComponent(shareId.toString())
		).then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

module.exports = shares;