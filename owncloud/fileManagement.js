//////////////////////////////////////
///////    FILES MANAGEMENT    ///////
//////////////////////////////////////
var Promise = require('es6-promise').Promise;
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

module.exports = files;