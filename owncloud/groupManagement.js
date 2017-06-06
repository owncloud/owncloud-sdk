//////////////////////////////////////
///////    GROUP MANAGEMENT    ///////
//////////////////////////////////////

var Promise = require('promise');
var parser = require('xml2json');
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
 * @param  		{string}   				groupName 		name of group to be created
 * @returns 	{Promise.<status>}						boolean: true if successful
 * @returns 	{Promise.<error> }						string: error message, if any.
 */
groups.prototype.createGroup = function(groupName) {
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
 * @param  		{string}   				groupName 		name of group to be created
 * @returns 	{Promise.<status>}						boolean: true if successful
 * @returns 	{Promise.<error> }						string: error message, if any.
 */
groups.prototype.deleteGroup = function(groupName) {
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
 * @returns 	{Promise.<groups>}						array: all group-names
 * @returns 	{Promise.<error> }						string: error message, if any.
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
 * @param  		{string}   				groupName 		name of group to list members
 * @returns 	{Promise.<users>}						array: all usernames who are part of the group
 * @returns 	{Promise.<error> }						string: error message, if any.
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
 * @param  		{string}   				groupName 		name of group to check
 * @returns 	{Promise.<status>}						boolean: true if group exists
 * @returns 	{Promise.<error> }						string: error message, if any.
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

/**
 * IS A RESPONSE HANDLER
 */
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