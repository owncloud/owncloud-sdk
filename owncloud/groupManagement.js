//////////////////////////////////////
///////    GROUP MANAGEMENT    ///////
//////////////////////////////////////

var Promise = require('es6-promise').Promise;
var request = require('request');
var parser = require('xml2json');
var shareInfo = require('./shareInfo.js');
var utf8 = require('utf8');
var querystring = require('querystring');
var helpers;

/**
 * @class groups
 * @classdesc 
 * <b><i> The groups class, has all the methods for group management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>Group Management</b>
 *         <ul>
 *         	<li>createGroup</li>
 *          <li>deleteGroup</li>
 *          <li>getGroups</li>
 *          <li>getGroupMembers</li>
 *          <li>groupExists</li>
 *         </ul>
 *     </li>
 * </ul>
 * 
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object} 		helperFile  	instance of the helpers class
 */
function groups(helperFile) {
	helpers = helperFile;
}

/**
 * creates a new group
 * @param  {string}   groupName name of group to be created
 * @param  {Function} callback  error, body(boolean)
 */
groups.prototype.createGroup = function(groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD, 'groups', {'groupid' : groupName})
		.then(data => {
			helpers._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * deletes an existing group
 * @param  {string}   groupName name of group to be created
 * @param  {Function} callback  error, body(boolean)
 */
groups.prototype.deleteGroup = function(groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_CLOUD, 'groups/' + groupName)
		.then(data => {
			helpers._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Gets all groups in the instance
 * @param  {Function} callback error, body(array of all groups)
 */
groups.prototype.getGroups = function() {
	var self = this;

	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, 'groups')
		.then(data => {
			self.handleObjectResponse(resolve, reject, data, 'groups');
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Gets all the members of a group
 * @param  {string}   groupName name of group to list members
 * @param  {Function} callback  error, body(array of all members)
 */
groups.prototype.getGroupMembers = function(groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, 'groups/' + encodeURIComponent(groupName))
		.then(data => {
			self.handleObjectResponse(resolve, reject, data, 'users');
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * checks whether a group exists
 * @param  {string}   groupName name of group to check
 * @param  {Function} callback  error, body(boolean)
 */
groups.prototype.groupExists = function(groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self.getGroups().then(groups => {
			resolve(groups.indexOf(groupName) > -1);
		}).catch(error => {
			reject(error);
		});
	});
};

groups.prototype.handleObjectResponse = function(resolve, reject, data, what) {
	var tree = parser.toJson(data.body, {object : true});
	var statusCode = parseInt(helpers._checkOCSstatusCode(tree));
	if (statusCode === 999) {
		reject("Provisioning API has been disabled at your instance");
		return;
	}

	var toReturn = tree.ocs.data[what].element || [];
	if (toReturn && toReturn.constructor !== Array) {
		// single element
		toReturn = [ toReturn ];
	}
	resolve(toReturn);
};

module.exports = groups;