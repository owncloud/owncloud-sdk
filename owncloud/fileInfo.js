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
		this.fileInfo[key] = attr[key];
	}
}

/**
 * Gets the name of file/folder
 * @returns 	{string}	name of file/folder  
 */
fileInfo.prototype.getName = function() {
	var name = this.name.split('/');
	name = name.filter(function(n){ return n !== ''; });
	var send = name[name.length - 1];

	return send;
};

/**
 * Gets path of file/folder
 * @returns 	{string} 	Path of file/folder
 */
fileInfo.prototype.getPath = function() {
	var name = this.name.split('/');
	name = name.filter(function(n){ return n !== ''; });
	var send = '/';
	for (var i=0;i<name.length-1;i++) {
		send += name[i] + '/';
	}

	return send;
};

/**
 * Gets size of the file/folder
 * @returns 	{Number} 	Size of file/folder
 */
fileInfo.prototype.getSize = function() {
	return parseInt(this.fileInfo['d:getcontentlength']) || null;
};

/**
 * Gets ETag of file/folder
 * @returns 	{string} 	ETag of file/folder
 */
fileInfo.prototype.getETag = function() {
	return this.fileInfo.['d:getetag'] || null;
};

/**
 * Gets content-type of file/folder
 * @returns 	{string} 	content-type of file/folder
 */
fileInfo.prototype.getContentType = function() {
	var type = this.fileInfo.['d:getcontenttype'];
	if (this.isDir()) {
		type = 'httpd/unix-directory';
	}
	return type;
};

/**
 * Gets last modified time of file/folder
 * @returns 	{Number} 	Last modified time of file/folder
 */
fileInfo.prototype.getLastModified = function() {
	return new Date(this.fileInfo.['d:getlastmodified']);
};

/**
 * Checks wether the information is for a folder
 * @returns 	{boolean} 	true if folder
 */
fileInfo.prototype.isDir = function() {
	return this.type === 'dir' ? true : false;
};

module.exports = fileInfo;