//////////////////////////////////////
///////    GROUP MANAGEMENT    ///////
//////////////////////////////////////

var request = require('request');
var parser = require('xml2json');
var shareInfo = require('./shareInfo.js');
var utf8 = require('utf8');
var querystring = require('querystring');
var Promise = require('es6-promise').Promise;

/**
 * @class ownCloud
 * @classdesc 
 * <b><i> The ownCloud class, where everything works!</i></b><br><br>
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
 *     </li><br>
 *     
 *     <li><b>Apps Management</b>
 *         <ul>
 *         	<li>getApps</li>
 *         	<li>getAttribute</li>
 *         	<li>setAttribute</li>
 *         	<li>deleteAttribute</li>
 *         	<li>enableApp</li>
 *         	<li>disableApp</li>
 *         </ul>
 *     </li><br>
 *     
 *     <li><b>Sharing</b>
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
 *
 *         </ul>
 *     </li><br>
 *     
 *     <li><b>User Management</b>
 *         <ul>
 *         	<li>createUser</li>
 *          <li>deleteUser</li>
 *          <li>searchUsers</li>
 *          <li>userExists</li>
 *          <li>getUsers</li>
 *          <li>setUserAttribute</li>
 *          <li>addUserToGroup</li>
 *          <li>getUserGroups</li>
 *          <li>userIsInGroup</li>
 *          <li>getUser</li>
 *          <li>removeUserFromGroup</li>
 *          <li>addUserToSubadminGroup</li>
 *          <li>getUserSubadminGroups</li>
 *          <li>userIsInSubadminGroup</li>
 *         </ul>
 *     </li><br>
 *
 *     <li><b>Group Management</b>
 *         <ul>
 *         	<li>createGroup</li>
 *          <li>deleteGroup</li>
 *          <li>getGroups</li>
 *          <li>getGroupMembers</li>
 *          <li>groupExists</li>
 *         </ul>
 *     </li><br>
 *     
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {string} 		URL 	URL of the ownCloud instance
 */
function groups() {
}

/**
 * creates a new group
 * @param  {string}   groupName name of group to be created
 * @param  {Function} callback  error, body(boolean)
 */
groups.prototype.createGroup = function(groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 'groups', {'groupid' : groupName})
		.then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
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
		self._makeOCSrequest('DELETE', self.OCS_SERVICE_CLOUD, 'groups/' + groupName)
		.then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
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
		self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 'groups')
		.then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var groups = tree.ocs.data.groups.element || [];
			if (groups && groups.constructor !== Array) {
				// single element
				groups = [ groups ];
			}
			resolve(groups);
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
		self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 'groups/' + encodeURIComponent(groupName))
		.then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var groups = tree.ocs.data.users.element || [];
			if (groups && groups.constructor !== Array) {
				// single element
				groups = [ groups ];
			}
			resolve(groups);
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

module.exports = groups;