const Promise = require('promise')

/**
 * @class Apps
 * @classdesc
 * <b><i> The apps class, has all the OC-Apps related methods.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>Apps Management</b>
 *       <ul>
 *           <li>getApps</li>
 *           <li>enableApp</li>
 *           <li>disableApp</li>
 *       </ul>
 *    </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object}    helperFile    instance of the helpers class
 */
class Apps {
  constructor (helperFile) {
    this.helpers = helperFile
  }

  /**
   * Gets all enabled and non-enabled apps downloaded on the instance.
   * @returns    {Promise.<apps>}     object: {for each app: Boolean("enabled or not")}
   * @returns    {Promise.<error>}    string: error message, if any.
   */
  getApps () {
    const send = {}

    const allAppsP = this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_CLOUD, 'apps')
    const allEnabledAppsP = this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_CLOUD, 'apps?filter=enabled')

    return Promise.all([allAppsP, allEnabledAppsP])
      .then(apps => {
        if (parseInt(this.helpers._checkOCSstatusCode(apps[0].data)) === 999) {
          return Promise.reject('Provisioning API has been disabled at your instance')
        }

        if ((!(apps[0].data.ocs.data)) || (!(apps[1].data.ocs.data))) {
          return Promise.reject(apps[0].data.ocs)
        }

        const allApps = apps[0].data.ocs.data.apps.element
        const allEnabledApps = apps[1].data.ocs.data.apps.element

        for (let i = 0; i < allApps.length; i++) {
          send[allApps[i]] = false
        }
        for (let i = 0; i < allEnabledApps.length; i++) {
          send[allEnabledApps[i]] = true
        }

        return Promise.resolve(send)
      })
  }

  /**
   * Enables an app via the Provisioning API
   * @param       {string}    appName      name of the app to be enabled
   * @returns     {Promise.<status>}   boolean: true if successful
   * @returns     {Promise.<error>}    string: error message, if any.
   */
  enableApp (appName) {
    return this.helpers._makeOCSrequest('POST', this.helpers.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appName))
      .then(data => {
        if (!data.body) {
          return Promise.reject('No app found by the name "' + appName + '"')
        }
        const statusCode = parseInt(this.helpers._checkOCSstatusCode(data.data))
        if (statusCode === 999) {
          return Promise.reject('Provisioning API has been disabled at your instance')
        }
        return Promise.resolve(true)
      })
  }

  /**
   * Disables an app via the Provisioning API
   * @param       {string}    appName      name of the app to be disabled
   * @returns     {Promise.<status>}   boolean: true if successful
   * @returns     {Promise.<error>}    string: error message, if any.
   */
  disableApp (appName) {
    return this.helpers._makeOCSrequest('DELETE', this.helpers.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appName))
      .then(data => {
        const statusCode = parseInt(this.helpers._checkOCSstatusCode(data.data))
        if (statusCode === 999) {
          return Promise.reject('Provisioning API has been disabled at your instance')
        }
        return Promise.resolve(true)
      })
  }
}

module.exports = Apps
