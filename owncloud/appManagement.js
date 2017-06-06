///////////////////////////////////
///////    APP MANGEMENT    ///////
///////////////////////////////////

var Promise = require('promise');
var parser = require('xml2json');
var helpers;

/**
 * @class apps
 * @classdesc 
 * <b><i> The apps class, has all the OC-Apps related methods.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>Apps Management</b>
 *         <ul>
 *         	<li>getApps</li>
 *         	<li>getAttribute</li>
 *         	<li>setAttribute</li>
 *         	<li>deleteAttribute</li>
 *         	<li>enableApp</li>
 *         	<li>disableApp</li>
 *         </ul>
 *     </li>
 * </ul>
 * 
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object} 		helperFile  	instance of the helpers class
 */
function apps(helperFile) {
	helpers = helperFile;
}

/**
 * Gets all enabled and non-enabled apps downloaded on the instance.
 * @returns 	{Promise.<apps> } 					object: {for each app: Boolean("enabled or not")}
 * @returns 	{Promise.<error>} 					string: error message, if any.
 */
apps.prototype.getApps = function() {
	var send = {};

	var allAppsP = helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, "apps");
	var allEnabledAppsP = helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, "apps?filter=enabled");

	return new Promise((resolve, reject) => {
		Promise.all([allAppsP, allEnabledAppsP])
		.then(apps => {
			var statuscode = parseInt(helpers._checkOCSstatusCode(parser.toJson(apps[0].body, {object: true})));
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
 * @param  		{string}   				app      	application ID (Generally app-name)
 * @param  		{string}   				key      	attribute key or None to retrieve all values for the given application
 * @returns 	{Promise.<attr> }					string: value of application's key
 * @returns 	{Promise.<error>}					string: error message, if any.
 */
apps.prototype.getAttribute = function(app, key) {
	var send = "getattribute";
	if (app) {
		send += '/' + encodeURIComponent(app);

		if (key) {
			send += '/' + encodeURIComponent(helpers._encodeString(key));
		}
	}
	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_PRIVATEDATA, send)
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
 * @param  		{string}   				app      	application ID (Generally app-name)
 * @param  		{string}   				key      	attribute key or None to retrieve all values for the given application
 * @param  		{string}   				value    	value to set of given attribute
 * @returns 	{Promise.<status>}					boolean: true if successful
 * @returns 	{Promise.<error> }					string: error message, if any.
 */
apps.prototype.setAttribute = function(app, key, value) {
	var self = this;
	var path = "setattribute/" + encodeURIComponent(app) + '/' + encodeURIComponent(helpers._encodeString(key));

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_PRIVATEDATA, path, 
		{'value' : helpers._encodeString(value)})
		.then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Deletes an application attribute
 * @param  		{string}   				app      	application ID (generally app-name)
 * @param  		{string}   				key      	attribute key to delete for the given application
 * @returns 	{Promise.<status>}					boolean: true if successful
 * @returns 	{Promise.<error> }					string: error message, if any.
 */
apps.prototype.deleteAttribute = function(app, key) {
	var self = this;
	var path = 'deleteattribute/' + encodeURIComponent(app) + '/' + encodeURIComponent(helpers._encodeString(key));

	/* jshint unused: false */
	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_PRIVATEDATA, path)
		.then(data => {
			resolve(true);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Enables an app via the Provisioning API
 * @param  		{string}   				app  		name of the app to be enabled
 * @returns 	{Promise.<status>}					boolean: true if successful
 * @returns 	{Promise.<error> }					string: error message, if any.
 */
apps.prototype.enableApp = function(appname) {
	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname))
		.then(data => {
			if (!data.body) {
				reject("No app found by the name \"" + appname + "\"");
			}
			helpers._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

/**
 * Disables an app via the Provisioning API
 * @param  		{string}   				app  		name of the app to be disabled
 * @returns 	{Promise.<status>}					boolean: true if successful
 * @returns 	{Promise.<error> }					string: error message, if any.
 */
apps.prototype.disableApp = function(appname) {
	return new Promise((resolve, reject) => {
		helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname))
		.then(data => {
			helpers._OCSuserResponseHandler(data, resolve, reject);
		}).catch(error => {
			reject(error);
		});
	});
};

module.exports = apps;