/////////////////////////////////////
///////    USER MANAGEMENT    ///////
/////////////////////////////////////

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
function users() {
}

/**
 * Creates user via the provisioning API<br>
 * If user already exists, an error is given back : "User already exists"<br>
 * If provisoning API has been disabled, an error is given back saying the same.
 * @param  {string}   username username of the new user to be created
 * @param  {string}   password password of the new user to be created
 * @param  {Function} callback error, body(boolean : whether user was created or not)
 */
users.prototype.createUser = function(username, password) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 'users', 
			{'password' : password, 'userid' : username}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Deletes a user via provisioning API
 * @param  {string}   username name of user to be deleted
 * @param  {Function} callback error, body(boolean)
 */
users.prototype.deleteUser = function(username) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('DELETE', self.OCS_SERVICE_CLOUD, 'users/' + username)
		.then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Searches for users via provisioning API
 * @param  {string}   name     username of the user to be searched
 * @param  {Function} callback error, body(array of search results i.e users)
 */
users.prototype.searchUsers = function(name) {
	var self = this;
	
	var action = 'users';
	if(name) { 
		action += '?search=' + name;
	}

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', this.OCS_SERVICE_CLOUD, action)
		.then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var users = tree.ocs.data.users.element || [];
			if (users && users.constructor !== Array) {
				users = [ users ];
			}
			resolve(users);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Checks a user via provisioning API
 * @param  {string}   name     name of user to be checked
 * @param {Function} callback error, body(boolean; whether exists or not)
 */
users.prototype.userExists = function(name) {
	var self = this;
	if (!name) {
		name = '';
	}

	return new Promise((resolve, reject) => {
		self.searchUsers(name).then(users => {
			resolve(users.indexOf(name) > -1);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Get all users via Provisioning API
 * @param  {Function} callback error, body(array of all users)
 */
users.prototype.getUsers = function() {
	var self = this;

	return new Promise((resolve, reject) => {
		self.searchUsers('').then(users => {
			resolve(users);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Sets a user attribute via the Provisioning API
 * @param {string}   username name of the user to modify
 * @param {string}   key      key of the attribute to be set (email, quota, display, password)
 * @param {string}   value    value to be set
 * @param {Function} callback error, body(boolean)
 */
users.prototype.setUserAttribute = function(username, key, value) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('PUT', self.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username), 
			{'key' :   self._encodeString(key), 'value' : self._encodeString(value)}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Adds a user to group
 * @param {string}   username  name of user to be added
 * @param {string}   groupName name of group user is to be added to
 * @param {Function} callback  error, body(boolean)
 */
users.prototype.addUserToGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/groups', {'groupid' : groupName}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Get a list of groups associated to a user
 * @param  {string}   username name of user to list groups
 * @param  {Function} callback error, body(array of user groups)
 */
users.prototype.getUserGroups = function(username) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', this.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/groups'
		).then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var groups = tree.ocs.data.groups.element || [];
			if (groups && groups.constructor !== Array) {
				groups = [ groups ];
			}
			resolve(groups);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Checks whether user is in group
 * @param  {string}   username  name of user
 * @param  {string}   groupName name of group
 * @param  {Function} callback  error, body(boolean)
 */
users.prototype.userIsInGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self.getUserGroups(username).then(groups => {
			resolve(groups.indexOf(groupName) > -1);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Retrieves information about a user
 * @param  {string}   username name of the user
 * @param  {Function} callback error, body(object having details of the user)
 */
users.prototype.getUser = function(username) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username)
		).then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var userInfo = tree.ocs.data || null;
			resolve(userInfo);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Removes user from a group
 * @param  {string}   username  name of user
 * @param  {string}   groupName name of group
 * @param  {Function} callback  error, body(boolean)
 */
users.prototype.removeUserFromGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('DELETE', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/groups', {'groupid' : groupName}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Adds user to a subadmin group
 * @param {string}   username  name of user
 * @param {string}   groupName name of group
 * @param {Function} callback  error, body(boolean)
 */
users.prototype.addUserToSubadminGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/subadmins', {'groupid' : groupName}
		).then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Get a list of subadmin groups associated to a user
 * @param  {string}   username name of user
 * @param  {Function} callback error, body(array of subadmin groups)
 */
users.prototype.getUserSubadminGroups = function(username) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, 
			'users/' + encodeURIComponent(username) + '/subadmins'
		).then(data => {
			var tree = parser.toJson(data.body, {object : true});
			var statusCode = parseInt(self._checkOCSstatusCode(tree));
			if (statusCode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var groups = tree.ocs.data.element || [];
			if (groups && groups.constructor !== Array) {
				groups = [ groups ];
			}
			resolve(groups);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Checks whether user is in subadmin group
 * @param  {string}   username  name of user
 * @param  {string}   groupName name of group
 * @param  {Function} callback  error, body(boolean)
 */
users.prototype.userIsInSubadminGroup = function(username, groupName) {
	var self = this;

	return new Promise((resolve, reject) => {
		self.getUserSubadminGroups(username).then(groups => {
			resolve(groups.indexOf(groupName) > -1);
		}).catch(error => {
			reject(error);
		});
	});
};

module.exports = users;