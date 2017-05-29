//////////////////////////////////////
///////    FILES MANAGEMENT    ///////
//////////////////////////////////////

var request = require('request');
var parser = require('xml2json');
var shareInfo = require('./shareInfo.js');
var utf8 = require('utf8');
var querystring = require('querystring');
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

module.exports = files;