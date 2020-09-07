const Promise = require('promise')

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
class Users {
  constructor (helperFile) {
    this.helpers = helperFile
  }

  /**
   * Creates user via the provisioning API<br>
   * If user already exists, an error is given back : "User already exists"<br>
   * If provisioning API has been disabled, an error is given back saying the same.
   *
   * @param      {string}  userName     username of the new user to be created
   * @param      {string}  password     password of the new user to be created
   * @param      {string[]} groups      list of group names for user is to be added to (must already exist)
   * @returns {Promise.<status>}  boolean: true if successful
   * @returns {Promise.<error>}     string: error message, if any.
   */
  createUser (userName, password, groups) {
    return new Promise((resolve, reject) => {
      const params = {
        password: password,
        userid: userName
      }

      if (groups && groups.length) {
        params.groups = groups
      }

      this.helpers._makeOCSrequest('POST', this.helpers.OCS_SERVICE_CLOUD, 'users', params).then(data => {
        this.helpers._OCSuserResponseHandler(data, resolve, reject)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Deletes a user via provisioning API
   * @param   {string}  userName    name of user to be deleted
   * @returns {Promise.<status>}    boolean: true if successful
   * @returns {Promise.<error>}     string: error message, if any.
   */
  deleteUser (userName) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('DELETE', this.helpers.OCS_SERVICE_CLOUD, 'users/' + userName)
        .then(data => {
          this.helpers._OCSuserResponseHandler(data, resolve, reject)
        }).catch(error => {
          reject(error)
        })
    })
  }

  /**
   * Searches for Users via provisioning API
   * @param   {string}          name  username of the user to be searched
   * @returns {Promise.<users>}       array: all users matching the search query
   * @returns {Promise.<error>}       string: error message, if any.
   */
  searchUsers (name) {
    const self = this

    let action = 'users'
    if (name) {
      action += '?search=' + name
    }

    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_CLOUD, action)
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
  userExists (name) {
    const self = this
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
  setUserAttribute (username, key, value) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('PUT', this.helpers.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username), {
        key: this.helpers._encodeString(key),
        value: this.helpers._encodeString(value)
      }).then(data => {
        this.helpers._OCSuserResponseHandler(data, resolve, reject)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Adds a user to group
   * @param   {string}  userName   name of user to be added
   * @param   {string}  groupName  name of group user is to be added to
   * @returns {Promise.<status>}   boolean: true if successful
   * @returns {Promise.<error>}    string: error message, if any.
   */
  addUserToGroup (userName, groupName) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('POST', this.helpers.OCS_SERVICE_CLOUD,
        'users/' + encodeURIComponent(userName) + '/groups', {
          groupid: groupName
        }
      ).then(data => {
        this.helpers._OCSuserResponseHandler(data, resolve, reject)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Get a list of groups associated to a user
   * @param   {string}  userName   name of user to list groups
   * @returns {Promise.<groups>}   array: all groups which user is part of
   * @returns {Promise.<error>}    string: error message, if any.
   */
  getUserGroups (userName) {
    const self = this

    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_CLOUD,
        'users/' + encodeURIComponent(userName) + '/groups'
      ).then(data => {
        self.handleObjectResponse(resolve, reject, data, 'groups')
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Checks whether user is in group
   * @param   {string}  userName   name of user
   * @param   {string}  groupName  name of group
   * @returns {Promise.<status>}   boolean: true if user is part of group
   * @returns {Promise.<error>}    string: error message, if any.
   */
  userIsInGroup (userName, groupName) {
    const self = this

    return new Promise((resolve, reject) => {
      self.getUserGroups(userName).then(groups => {
        resolve(groups.indexOf(groupName) > -1)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Retrieves information about a user
   * @param   {string}    userName    name of the user
   * @returns {Promise.<userInfo>}    object: all user related information
   * @returns {Promise.<error>}       string: error message, if any.
   */
  getUser (userName) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_CLOUD,
        'users/' + encodeURIComponent(userName)
      ).then(data => {
        const statusCode = parseInt(this.helpers._checkOCSstatusCode(data.data))
        if (statusCode === 999) {
          reject('Provisioning API has been disabled at your instance')
          return
        }

        const userInfo = data.data.ocs.data || null
        resolve(userInfo)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Removes user from a group
   * @param   {string}  userName   name of user
   * @param   {string}  groupName  name of group
   * @returns {Promise.<status>}   boolean: true if successful
   * @returns {Promise.<error>}    string: error message, if any.
   */
  removeUserFromGroup (userName, groupName) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('DELETE', this.helpers.OCS_SERVICE_CLOUD,
        'users/' + encodeURIComponent(userName) + '/groups', {
          groupid: groupName
        }
      ).then(data => {
        this.helpers._OCSuserResponseHandler(data, resolve, reject)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Adds user to a subadmin group
   * @param   {string} userName    name of user
   * @param   {string} groupName   name of group
   * @returns {Promise.<status>}   boolean: true if successful
   * @returns {Promise.<error>}    string: error message, if any.
   */
  addUserToSubadminGroup (userName, groupName) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('POST', this.helpers.OCS_SERVICE_CLOUD,
        'users/' + encodeURIComponent(userName) + '/subadmins', {
          groupid: groupName
        }
      ).then(data => {
        this.helpers._OCSuserResponseHandler(data, resolve, reject)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Get a list of subadmin groups associated to a user
   * @param   {string}  userName  name of user
   * @returns {Promise.<groups>}  array: all groups user is admin of
   * @returns {Promise.<error>}   string: error message, if any.
   */
  getUserSubadminGroups (userName) {
    const self = this

    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_CLOUD,
        'users/' + encodeURIComponent(userName) + '/subadmins'
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
   * @param   {string}  userName   name of user
   * @param   {string}  groupName  name of group
   * @returns {Promise.<status>}   boolean: true if user is admin of specified group
   * @returns {Promise.<error>}    string: error message, if any.
   */
  userIsInSubadminGroup (userName, groupName) {
    const self = this

    return new Promise((resolve, reject) => {
      self.getUserSubadminGroups(userName).then(groups => {
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
  getUsers () {
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
  handleObjectResponse (resolve, reject, data, what) {
    const statusCode = parseInt(this.helpers._checkOCSstatusCode(data.data))

    if (statusCode === 999) {
      reject('Provisioning API has been disabled at your instance')
      return
    }

    let toReturn
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
}

module.exports = Users
