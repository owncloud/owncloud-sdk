const Promise = require('promise')
const HelperFile = require('./helperFunctions.js')
const Apps = require('./appManagement.js')
const Shares = require('./shareManagement.js')
const Users = require('./userManagement.js')
const Groups = require('./groupManagement.js')
const Files = require('./fileManagement.js')
const FileVersion = require('./fileVersionManagement.js')

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
 * @param {string}  instance  URL of the ownCloud instance
 * @param {object}  options   additional options
 */
function ownCloud (instance, options = {}) {
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

  var helpers = new HelperFile()
  helpers.setInstance(set)
  if (options.auth) {
    if (options.auth.bearer) {
      helpers.setAuthorization('Bearer ' + options.auth.bearer)
    }
    if (options.auth.basic) {
      var basicAuth = 'Basic ' + Buffer.from(options.auth.basic.username + ':' + options.auth.basic.password).toString('base64')
      helpers.setAuthorization('Bearer ' + basicAuth)
    }
  }
  if (options.userInfo) {
    helpers.setCurrentUser(options.userInfo)
  }

  this.helpers = helpers
  this.apps = new Apps(this.helpers)
  this.shares = new Shares(this.helpers)
  this.users = new Users(this.helpers)
  this.groups = new Groups(this.helpers)
  this.files = new Files(this.helpers)
  this.fileVersions = new FileVersion(this.helpers)
  this.requests = {
    ocs: function (options = {}) {
      return helpers.ocs(options)
    }
  }
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
  return this.helpers.getCurrentUserAsync()
}

module.exports = ownCloud
