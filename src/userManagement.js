var Promise = require('promise')
var helpers

/**
 * @class Users
 * @classdesc
 * <b><i> The Users class, has all the methods for user management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>User Management</b>
 *      <ul>
 *          <li>createUser</li>
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
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object}    helperFile    instance of the helpers class
 */
function Users (helperFile) {
  helpers = helperFile
}

/**
 * Creates user via the provisioning API<br>
 * If user already exists, an error is given back : "User already exists"<br>
 * If provisoning API has been disabled, an error is given back saying the same.
 *
 * @param      {string}  username     username of the new user to be created
 * @param      {string}  password     password of the new user to be created
 * @returns {Promise.<status>}  boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
Users.prototype.createUser = function (username, password) {
  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD, 'users', {
      'password': password,
      'userid': username
    }).then(data => {
      helpers._OCSuserResponseHandler(data, resolve, reject)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Deletes a user via provisioning API
 * @param      {string}  username    name of user to be deleted
 * @returns {Promise.<status>}  boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
Users.prototype.deleteUser = function (username) {
  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_CLOUD, 'users/' + username)
      .then(data => {
        helpers._OCSuserResponseHandler(data, resolve, reject)
      }).catch(error => {
        reject(error)
      })
  })
}

/**
 * Searches for Users via provisioning API
 * @param      {string}  name  username of the user to be searched
 * @returns {Promise.<users>}    array: all users matching the search query
 * @returns {Promise.<error>}      string: error message, if any.
 */
Users.prototype.searchUsers = function (name) {
  var self = this

  var action = 'users'
  if (name) {
    action += '?search=' + name
  }

  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, action)
      .then(data => {
        self.handleObjectResponse(resolve, reject, data, 'users')
      }).catch(error => {
        reject(error)
      })
  })
}

/**
 * Checks a user via provisioning API
 * @param      {string}  name  name of user to be checked
 * @returns {Promise.<status>}  boolean: true if exists
 * @returns {Promise.<error>}     string: error message, if any.
 */
Users.prototype.userExists = function (name) {
  var self = this
  if (!name) {
    name = ''
  }

  return new Promise((resolve, reject) => {
    self.searchUsers(name).then(users => {
      resolve(users.indexOf(name) > -1)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Sets a user attribute via the Provisioning API
 * @param     {string}  username     name of the user to modify
 * @param     {string}  key       key of the attribute to be set (email, quota, display, password)
 * @param     {string}  value        value to be set
 * @returns {Promise.<status>}  boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
Users.prototype.setUserAttribute = function (username, key, value) {
  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('PUT', helpers.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username), {
      'key': helpers._encodeString(key),
      'value': helpers._encodeString(value)
    }).then(data => {
      helpers._OCSuserResponseHandler(data, resolve, reject)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Adds a user to group
 * @param   {string}  username   name of user to be added
 * @param   {string}  groupName  name of group user is to be added to
 * @returns {Promise.<status>}   boolean: true if successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
Users.prototype.addUserToGroup = function (username, groupName) {
  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD,
      'users/' + encodeURIComponent(username) + '/groups', {
        'groupid': groupName
      }
    ).then(data => {
      helpers._OCSuserResponseHandler(data, resolve, reject)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Get a list of groups associated to a user
 * @param   {string}  username   name of user to list groups
 * @returns {Promise.<groups>}   array: all groups which user is part of
 * @returns {Promise.<error>}    string: error message, if any.
 */
Users.prototype.getUserGroups = function (username) {
  var self = this

  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD,
      'users/' + encodeURIComponent(username) + '/groups'
    ).then(data => {
      self.handleObjectResponse(resolve, reject, data, 'groups')
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Checks whether user is in group
 * @param   {string}  username   name of user
 * @param   {string}  groupName  name of group
 * @returns {Promise.<status>}   boolean: true if user is part of group
 * @returns {Promise.<error>}    string: error message, if any.
 */
Users.prototype.userIsInGroup = function (username, groupName) {
  var self = this

  return new Promise((resolve, reject) => {
    self.getUserGroups(username).then(groups => {
      resolve(groups.indexOf(groupName) > -1)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Retrieves information about a user
 * @param   {string}    username    name of the user
 * @returns {Promise.<userInfo>}    object: all user related information
 * @returns {Promise.<error>}       string: error message, if any.
 */
Users.prototype.getUser = function (username) {
  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD,
      'users/' + encodeURIComponent(username)
    ).then(data => {
      var statusCode = parseInt(helpers._checkOCSstatusCode(data.data))
      if (statusCode === 999) {
        reject('Provisioning API has been disabled at your instance')
        return
      }

      var userInfo = data.data.ocs.data || null
      resolve(userInfo)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Removes user from a group
 * @param   {string}  username   name of user
 * @param   {string}  groupName  name of group
 * @returns {Promise.<status>}   boolean: true if successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
Users.prototype.removeUserFromGroup = function (username, groupName) {
  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_CLOUD,
      'users/' + encodeURIComponent(username) + '/groups', {
        'groupid': groupName
      }
    ).then(data => {
      helpers._OCSuserResponseHandler(data, resolve, reject)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Adds user to a subadmin group
 * @param   {string} username    name of user
 * @param   {string} groupName   name of group
 * @returns {Promise.<status>}   boolean: true if successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
Users.prototype.addUserToSubadminGroup = function (username, groupName) {
  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD,
      'users/' + encodeURIComponent(username) + '/subadmins', {
        'groupid': groupName
      }
    ).then(data => {
      helpers._OCSuserResponseHandler(data, resolve, reject)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Get a list of subadmin groups associated to a user
 * @param   {string}  username  name of user
 * @returns {Promise.<groups>}  array: all groups user is admin of
 * @returns {Promise.<error>}   string: error message, if any.
 */
Users.prototype.getUserSubadminGroups = function (username) {
  var self = this

  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD,
      'users/' + encodeURIComponent(username) + '/subadmins'
    ).then(data => {
      self.handleObjectResponse(resolve, reject, data)
    }).catch(error => {
      // OC-10 gives this message is user is sub-admin of no group
      if (error === 'Unknown error occurred') {
        resolve([])
      }
      reject(error)
    })
  })
}

/**
 * Checks whether user is in subadmin group
 * @param   {string}  username   name of user
 * @param   {string}  groupName  name of group
 * @returns {Promise.<status>}   boolean: true if user is admin of specified group
 * @returns {Promise.<error>}    string: error message, if any.
 */
Users.prototype.userIsInSubadminGroup = function (username, groupName) {
  var self = this

  return new Promise((resolve, reject) => {
    self.getUserSubadminGroups(username).then(groups => {
      resolve(groups.indexOf(groupName) > -1)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Get all users via Provisioning API
 * @returns {Promise.<users>}   array: all users
 * @returns {Promise.<error>}   string: error message, if any.
 */
Users.prototype.getUsers = function () {
  return new Promise((resolve, reject) => {
    this.searchUsers('').then(users => {
      resolve(users)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * IS A RESPONSE HANDLER
 */
Users.prototype.handleObjectResponse = function (resolve, reject, data, what) {
  var statusCode = parseInt(helpers._checkOCSstatusCode(data.data))

  if (statusCode === 999) {
    reject('Provisioning API has been disabled at your instance')
    return
  }

  var toReturn
  if (what) {
    toReturn = data.data.ocs.data[what].element || []
  } else {
    toReturn = data.data.ocs.data.element || []
  }
  if (toReturn && toReturn.constructor !== Array) {
    toReturn = [toReturn]
  }
  resolve(toReturn)
}

module.exports = Users
