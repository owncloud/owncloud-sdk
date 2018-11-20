/// //////////////////////////
/// ////    GENERAL    ///////
/// //////////////////////////

var Promise = require('promise')
var helperFile = require('./helperFunctions.js')
var apps = require('./appManagement.js')
var shares = require('./shareManagement.js')
var users = require('./userManagement.js')
var groups = require('./groupManagement.js')
var files = require('./fileManagement.js')
var fileVersion = require('./fileVersionManagement.js')

/**
 * @class ownCloud
 * @classdesc
 * <b><i> The ownCloud class, the main class which holds all other classes like shares, apps etc.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *  <li><b>General</b>
 *      <ul>
 *          <li>setInstance</li>
 *          <li>login</li>
 *          <li>getConfig</li>
 *          <li>getVersion</li>
 *          <li>getCapabilities</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {string}  URL  URL of the ownCloud instance
 */
function ownCloud (instance) {
  var slash = ''
  instance = instance || ''

  if (instance.slice(-1) !== '/') {
    slash = '/'
  }

  var http = ''
  if (instance.slice(0, 4) !== 'http') {
    http = 'http://'
  }
  var set = http + instance + slash

  if (!instance) {
    set = ''
  }

  var helpers = new helperFile()
  helpers.setInstance(set)

  this.helpers = helpers
  this.apps = new apps(this.helpers)
  this.shares = new shares(this.helpers)
  this.users = new users(this.helpers)
  this.groups = new groups(this.helpers)
  this.files = new files(this.helpers)
  this.fileVersions = new fileVersion(this.helpers)
}

/**
 * Logs in to the specified ownCloud instance (Updates capabilities)
 * @param   {string} username     name of the user to login
 * @param   {string} password     password of the user to login
 * @returns {Promise.<status>}    boolean: whether login was successful or not
 * @returns {Promise.<error>}     string: error message, if any.
 */
ownCloud.prototype.login = function (username, password) {
  var basicAuth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
  this.helpers.setAuthorization(basicAuth)

  var self = this
  /* jshint unused: false */
  return new Promise((resolve, reject) => {
    this.helpers._updateCapabilities()
      .then(() => {
        resolve(self.getCurrentUser())
      }).catch(error => {
        reject(error)
      })
  })
  /* jshint unused: true */
}

/**
 * Logs in to the specified ownCloud instance (Updates capabilities)
 * @param   {string} token        name of the user to login
 * @returns {Promise.<status>}    boolean: whether login was successful or not
 * @returns {Promise.<error>}     string: error message, if any.
 */
ownCloud.prototype.loginWithBearer = function (token) {
  this.helpers.setAuthorization('Bearer ' + token)

  var self = this
  /* jshint unused: false */
  return new Promise((resolve, reject) => {
    this.helpers._updateCapabilities()
      .then(() => {
        resolve(self.getCurrentUser())
      }).catch(error => {
        reject(error)
      })
  })
  /* jshint unused: true */
}

ownCloud.prototype.logout = function () {
  this.helpers.logout()
}

/**
 * Logs in to the specified ownCloud instance (Updates capabilities)
 * @param   {string}  instance    URL of the OC instance
 * @returns {boolean}             always true.
 */
ownCloud.prototype.setInstance = function (instance) {
  var slash = ''
  instance = instance || ''

  if (instance.slice(-1) !== '/') {
    slash = '/'
  }

  var http = ''
  if (instance.slice(0, 4) !== 'http') {
    http = 'http://'
  }
  var set = http + instance + slash

  if (!instance) {
    set = ''
  }

  this.helpers.setInstance(set)

  return true
}

/**
 * Returns ownCloud config information
 * @returns {Promise.<configs>} object: {"version" : "1.7", "website" : "ownCloud" etc...}
 * @returns {Promise.<error>}     string: error message, if any.
 */
ownCloud.prototype.getConfig = function () {
  return new Promise((resolve, reject) => {
    this.helpers._makeOCSrequest('GET', '', 'config')
      .then(data => {
        resolve(data.data.ocs.data)
      }).catch(error => {
        reject(error)
      })
  })
}

/**
 * Gets the ownCloud version of the connected server
 * @returns {Promise.<version>} string: ownCloud version
 * @returns {Promise.<error>}     string: error message, if any.
 */
ownCloud.prototype.getVersion = function () {
  var version = this.helpers.getVersion()

  /* jshint unused: false */
  return new Promise((resolve, reject) => {
    if (version === null) {
      this.helpers._updateCapabilities()
        .then(body => {
          resolve(this.helpers.getVersion())
        }).catch(error => {
          reject(error)
        })
    } else {
      resolve(version)
    }
  })
}

/**
 * Gets the ownCloud app capabilities
 * @returns {Promise.<capabilities>}    string: ownCloud version
 * @returns {Promise.<reject>}             object: capabilites
 */
ownCloud.prototype.getCapabilities = function () {
  var capabilities = this.helpers.getCapabilities()
  /* jshint unused: false */
  return new Promise((resolve, reject) => {
    if (capabilities === null) {
      this.helpers._updateCapabilities()
        .then(body => {
          resolve(body)
        }).catch(error => {
          reject(error)
        })
    } else {
      resolve(capabilities)
    }
  })
}

/**
 * Gets the currently logged in user
 * @returns {Promise.<capabilities>}
 * @returns {Promise.<reject>}
 */
ownCloud.prototype.getCurrentUser = function () {
  var user = this.helpers.getCurrentUser()
  /* jshint unused: false */
  return new Promise((resolve, reject) => {
    if (user === null) {
      this.helpers._updateCurrentUser()
        .then(body => {
          resolve(body)
        }).catch(error => {
          reject(error)
        })
    } else {
      resolve(user)
    }
  })
}

module.exports = ownCloud
