/////////////////////////////
///////    GENERAL    ///////
/////////////////////////////

var Promise = require('promise');
var parser = require('xml2json');
var helperFile = require('./helperFunctions.js');
var apps = require('./appManagement.js');
var shares = require('./shareManagement.js');
var users = require('./userManagement.js');
var groups = require('./groupManagement.js');
var files = require('./fileManagement.js');
var helpers = new helperFile();

/**
 * @class ownCloud
 * @classdesc 
 * <b><i> The ownCloud class, the main class which holds all other classes like shares, apps etc.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>General</b>
 *         <ul>
 *          <li>initLibrary</li>
 *          <li>login</li>
 *          <li>getConfig</li>
 *          <li>getVersion</li>
 *          <li>getCapabilities</li>
 *         </ul>
 *     </li>
 * </ul>
 *     
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {string} 		URL 	URL of the ownCloud instance
 */
function ownCloud(instance) {
	var slash = '';
	if (instance.slice(-1) !== '/') {
		slash = '/';
	}

	var http = '';
	if (instance.slice(0, 4) !== "http") {
		http = 'http://';
	}

	helpers.setInstance(http + instance + slash);

	this.apps = new apps(helpers);
	this.shares = new shares(helpers);
	this.users = new users(helpers);
	this.groups = new groups(helpers);
	this.files = new files(helpers);
}

/**
 * Logs in to the specified ownCloud instance (Updates capabilities)
 * @param {string} 		username 	name of the user to login
 * @param {string} 		password 	password of the user to login
 * @param {Function} 	callback 	error, body(boolean)
 */
ownCloud.prototype.login = function(username, password) {
	helpers.setUsername(username);
	helpers.setPassword(password);

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		helpers._updateCapabilities()
		.then(body => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
	/* jshint unused: true */
};

/**
 * Returns ownCloud config information
 * @param  {Function} callback error, body(object : {"version" : "1.7", "website" : "ownCloud" etc...})
 */
ownCloud.prototype.getConfig = function() {
	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('GET', '', 'config')
		.then(data => {
			var tree = parser.toJson(data.body, {object: true});
			resolve(tree.ocs.data);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Gets the ownCloud version of the connected server
 * @param {Function}  callback  error, body(string : version)
 */
ownCloud.prototype.getVersion = function() {
	var self = this;
	var version = helpers.getVersion();

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		if (version === null) {
			helpers._updateCapabilities()
			.then(body => {
				resolve(helpers.getVersion());
			}).catch(error => {
				reject(error);
			});
		}
		else {
			resolve(version);
		}
	});
};

/**
 * Gets the ownCloud app capabilities
 * @param {Function}  callback 	error, body(object containing capabilities)
 */
ownCloud.prototype.getCapabilities = function() {
	var self = this;
	var capabilities = helpers.getCapabilities();
	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		if (capabilities === null) {
			helpers._updateCapabilities()
			.then(body => {
				resolve(body);
			}).catch(error => {
				reject(error);
			});
		}
		else {
			resolve(capabilities);
		}
	});
};

module.exports = ownCloud;
