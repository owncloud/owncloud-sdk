///////////////////////////////////
///////    APP MANGEMENT    ///////
///////////////////////////////////

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
function apps() {
}

/**
 * Gets all enabled and non-enabled apps downloaded on the instance.
 * @param {Function} 	callback 	 error, body(apps)
 */
apps.prototype.getApps = function() {
	var self = this;
	var send = {};

	var allAppsP = this._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "apps");
	var allEnabledAppsP = self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "apps?filter=enabled");

	return new Promise((resolve, reject) => {
		Promise.all([allAppsP, allEnabledAppsP])
		.then(apps => {
			var statuscode = parseInt(this._checkOCSstatusCode(parser.toJson(apps[0].body, {object: true})));
			if (statuscode === 999) {
				reject("Provisioning API has been disabled at your instance");
				return;
			}

			var allApps = parser.toJson(apps[0].body, {object: true}).ocs.data.apps.element;
			var allEnabledApps = parser.toJson(apps[1].body, {object: true}).ocs.data.apps.element;

			for (var i=0;i<allApps.length;i++) {
				send[allApps[i]] = false;
			}
			for (i=0;i<allEnabledApps.length;i++) {
				send[allEnabledApps[i]] = true;
			}

			resolve(send);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Returns an application attribute
 * @param  {string}   app      application ID (Generally app-name)
 * @param  {string}   key      attribute key or None to retrieve all values for the given application
 * @param  {Function} callback error, body(object {key1 : value1, key2 : value2 etc...})
 */
apps.prototype.getAttribute = function(app, key) {
	var self = this;

	var send = "getattribute";
	if (app) {
		send += '/' + encodeURIComponent(app);

		if (key) {
			send += '/' + encodeURIComponent(this._encodeString(key));
		}
	}

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('GET', this.OCS_SERVICE_PRIVATEDATA, send)
		.then(data => {

			var elements = parser.toJson(data.body, {object: true}).ocs.data.element;

			if (key) {
				if (!elements) {
					resolve(null);
				}
				else {
					var value = elements.value;
					elements.value = Object.keys(value).length === 0 && value.constructor === Object ? '' : value;
					resolve(elements.value);
				}
			}
			else {
				if (!elements) {
					resolve({});
					return;
				}
				if (elements.constructor !== Array) {
					elements = [ elements ];
				}
				var allAttributes = {};
				for (var i=0;i<elements.length;i++) {
					allAttributes[elements[i].key] = elements[i].value;
				}
				resolve(allAttributes);
			}
		})
		.catch(error => {
			reject(error);
		});
	});
};

/**
 * Sets an application attribute
 * @param  {string}   app      application ID (Generally app-name)
 * @param  {string}   key      attribute key or None to retrieve all values for the given application
 * @param  {string}   value    value to set of given attribute
 * @param  {Function} callback error, body(boolean)
 */
apps.prototype.setAttribute = function(app, key, value) {
	var self = this;
	var path = "setattribute/" + encodeURIComponent(app) + '/' + encodeURIComponent(this._encodeString(key));

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_PRIVATEDATA, path, 
		{'value' : self._encodeString(value)})
		.then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Deletes an application attribute
 * @param  {string}   app      application ID (generally app-name)
 * @param  {string}   key      attribute key to delete for the given application
 * @param  {Function} callback error, body(boolean)
 */
apps.prototype.deleteAttribute = function(app, key) {
	var self = this;
	var path = 'deleteattribute/' + encodeURIComponent(app) + '/' + encodeURIComponent(self._encodeString(key));

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', self.OCS_SERVICE_PRIVATEDATA, path)
		.then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * enables an app via the Provisioning API
 * @param  {string}   appname  name of the app to be enabled
 * @param  {Function} callback error, body(boolean)
 */
apps.prototype.enableApp = function(appname) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('POST', this.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname))
		.then(data => {
			if (!data.body) {
				reject("No app found by the name \"" + appname + "\"");
			}
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * disables an app via the Provisioning API
 * @param  {string}   appname  name of the app to be disabled
 * @param  {Function} callback error, body(boolean)
 */
apps.prototype.disableApp = function(appname) {
	var self = this;

	return new Promise((resolve, reject) => {
		self._makeOCSrequest('DELETE', this.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname))
		.then(data => {
			self._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

module.exports = apps;