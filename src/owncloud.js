const Promise = require('promise')
const HelperFile = require('./helperFunctions.js')
const Apps = require('./appManagement.js')
const Shares = require('./shareManagement.js')
const Users = require('./userManagement.js')
const Groups = require('./groupManagement.js')
const Files = require('./fileManagement.js')
const FileVersion = require('./fileVersionManagement.js')
const SystemTags = require('./systemTags.js')
const FilesTrash = require('./filesTrash.js')
const PublicFiles = require('./publicLinkAccess.js')
const Settings = require('./settings.js')

/**
 * @class ownCloud
 * @classdesc
 * <b><i> The ownCloud class, the main class which holds all other classes like shares, apps etc.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *  <li><b>General</b>
 *      <ul>
 *          <li>init</li>
 *          <li>login</li>
 *          <li>logout</li>
 *          <li>getConfig</li>
 *          <li>getCapabilities</li>
 *          <li>getCurrentUser</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object}  options   additional options
 */
class ownCloud {
  constructor (options = {}) {
    this.init(options)
  }

  init (options) {
    let baseUrl = ''
    if (options.baseUrl) {
      baseUrl = new URL(options.baseUrl).href
    }

    const helpers = new HelperFile()
    helpers.setInstance(baseUrl)
    if (options.auth) {
      if (options.auth.bearer) {
        helpers.setAuthorization('Bearer ' + options.auth.bearer)
      }
      if (options.auth.basic) {
        const basicAuth = 'Basic ' + Buffer.from(options.auth.basic.username + ':' + options.auth.basic.password).toString('base64')
        helpers.setAuthorization(basicAuth)
      }
    }
    if (options.userInfo) {
      helpers.setCurrentUser(options.userInfo)
    }
    if (options.signingKey) {
      helpers.setSigningKey(options.signingKey)
    }
    if (options.headers) {
      helpers.setHeaders(options.headers)
    }

    this.helpers = helpers
    this.apps = new Apps(this.helpers)
    this.shares = new Shares(this.helpers)
    this.users = new Users(this.helpers)
    this.groups = new Groups(this.helpers)
    this.files = new Files(this.helpers)
    this.fileVersions = new FileVersion(this.helpers)
    this.systemTags = new SystemTags(this.helpers)
    this.fileTrash = new FilesTrash(this.helpers)
    this.publicFiles = new PublicFiles(this.helpers)
    this.settings = new Settings(this.helpers)
    this.requests = {
      ocs: function (options = {}) {
        return helpers.ocs(options)
      }
    }
  }

  /**
   * Logs in to the specified ownCloud instance (Updates capabilities)
   * @returns {Promise.<status>}    boolean: whether login was successful or not
   * @returns {Promise.<error>}     string: error message, if any.
   */
  login () {
    const self = this
    return this.helpers.getCapabilities()
      .then(() => {
        return Promise.resolve(self.getCurrentUser())
      })
  }

  logout () {
    this.helpers.logout()
  }

  /**
   * Returns ownCloud config information
   * @returns {Promise.<configs>} object: {"version" : "1.7", "website" : "ownCloud" etc...}
   * @returns {Promise.<error>}     string: error message, if any.
   */
  getConfig () {
    return this.helpers._makeOCSrequest('GET', '', 'config')
      .then(data => {
        return Promise.resolve(data.data.ocs.data)
      })
  }

  /**
   * Gets the ownCloud app capabilities
   * @returns {Promise.<capabilities>}    string: ownCloud version
   * @returns {Promise.<reject>}             object: capabilities
   */
  getCapabilities () {
    return this.helpers.getCapabilities()
  }

  /**
   * Gets the currently logged in user
   * @returns {Promise.<user>}
   * @returns {Promise.<reject>}
   */
  getCurrentUser () {
    return this.helpers.getCurrentUserAsync()
  }

  /**
   *
   * @param {string} url
   * @param {number} ttl
   * @param {string} httpMethod
   *
   * @returns {Promise}
   */
  signUrl (url, ttl = 1200, httpMethod = 'get') {
    return this.helpers.signUrl(url, ttl, httpMethod)
  }
}

module.exports = ownCloud
