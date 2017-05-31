/*jshint camelcase: false */

/**
 * @class fileInfo
 * @classdesc fileInfo class, stores information regarding a file/folder
 * @param 	{string}	name 	name of file/folder
 * @param 	{string}	type    "file" => file ; "dir" => folder
 * @param 	{string}	attr 	attributes of file like size, time added etc.
 */
function fileInfo(name, type, attr) {
	this.name = name;
	this.type = type;
	this.fileInfo = {};

	for (var key in attr) {
		this.fileInfo[key.split(':')[1]] = attr[key];
	}
}

/**
 * Gets the name of file/folder
 * @returns 	{string}	name of file/folder  
 */
fileInfo.prototype.getName = function() {
	return this.name;
};

/**
 * Gets share type of share
 * @returns {Number} Share type of share
 */
fileInfo.prototype.getPath = function() {
	var name = this.name.split('/');
	var send = '/';
	for (var i=0;i<name.length-1;i++) {
		send += name[i];
	}

	return send;
};

/**
 * Gets shareWith of the share
 * @returns {string} shareWith of share
 */
fileInfo.prototype.getSize = function() {
	return parseInt(this.fileInfo.getcontentlength) || null;
};

/**
 * Gets display name of share
 * @returns {string} display name of share
 */
fileInfo.prototype.getETag = function() {
	return this.fileInfo.getetag || null;
};

/**
 * Gets permissions of share
 * @returns {string} permissions of share
 */
fileInfo.prototype.getContentType = function() {
	var type = this.fileInfo.getcontenttype;
	if (this.isDir()) {
		type = 'httpd/unix-directory';
	}
	return type;
};

/**
 * Gets share time of share
 * @returns {Number} Share time of share
 */
fileInfo.prototype.getLastModified = function() {
	return new Date(this.fileInfo.getlastmodified);
};

/**
 * Gets expiration time of share
 * @returns {Number} Expiration time of share
 */
fileInfo.prototype.isDir = function() {
	return this.type === 'dir' ? true : false;
};

module.exports = fileInfo;