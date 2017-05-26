//////////////////////////////////////
///////    FILES MANAGEMENT    ///////
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
function files() {
}

module.exports = files;