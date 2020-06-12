const SettingsClient = require('../vendor/settingsClient')
const Promise = require('promise')

/**
 * @class SettingsValues
 * @classdesc
 * <b><i> The SettingsValues class provides access to all settings values of the (most of the time authenticated) user.</i></b>
 *
 * @author Benedikt Kulmann
 * @version 1.0.0
 * @param {object}  helperFile  instance of the helpers class
 */
class SettingsValues {
  constructor (helpers) {
    this.helpers = helpers
  }

  /**
   * Gets all settings values for the given account uuid. If no uuid is provided, settings values
   * for the authenticated user will be fetched. If the settings service is unavailable, a set of
   * default values will be returned (if there are any defaults).
   * @param   {string} accountUuid The accountUuid to fetch settings for. Most of the time we want to fetch settings
   *                               for the authenticated user. So this defaults to `me`, which will resolve the
   *                               account uuid of the authenticated user in the settings service.
   * @returns {Promise.<settings>} array: all available settings values
   * @returns {Promise.<error>}    string: error message, if any.
   */
  async getSettingsValues (accountUuid = 'me') {
    try {
      const baseUrl = this.helpers.getInstance().replace(/\/$/, '')
      const response = await SettingsClient.ValueService_ListSettingsValues({
        $domain: baseUrl,
        body: {
          identifier: {
            account_uuid: accountUuid
          }
        }
      })
      if (response.status === 201) {
        return Promise.resolve(response.data.settingsValues || [])
      }
    } catch (error) {
      // fail on anything except settings service being unavailable
      if (error.response.status !== 502 && error.response.status !== 404) {
        return Promise.reject(error)
      }
    }
    // TODO: build a sensible set of defaults here, if necessary.
    return Promise.resolve([])
  }
}

module.exports = SettingsValues
