var Promise = require('promise')
const { Dav } = require('./dav')

/**
 * @class Tags
 * @classdesc
 * <b><i> The SystemTags class, has all the methods for ownCloud system tags management.</i></b><br><br>
 *
 * @version 1.0.0
 * @param   {helpers}    helperFile  instance of the helpers class
 */
class Tags {
  constructor (helperFile) {
    this.helpers = helperFile
    this.davClient = new Dav(this.helpers._davPath)
  }

  /**
   * Add tags to resource
   * @param   {string}    spaceRef          the space ref
   * @param   {array}     tags              the tags
   * @returns {Promise.<number>}            id of the newly created system tag
   * @returns {Promise.<error>}             string: error message, if any.
   */
  addResourceTag (spaceRef, tags) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }
    const path = 'tags/' + spaceRef

    return this.davClient.request('PUT',
      this.helpers._buildFullDAVPath(path) + '?tags=' + tags.join(','),
      this.helpers.buildHeaders(),
      null
    ).then(result => {
      if (result.status !== 200) {
        return Promise.reject(new Error('Error: ' + result.status))
      } else {
        return Promise.resolve()
      }
    })
  }

  removeResourceTag (spaceRef, tags) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }
    const path = 'tags/' + spaceRef

    return this.davClient.request('DELETE',
      this.helpers._buildFullDAVPath(path) + '?tags=' + tags.join(','),
      this.helpers.buildHeaders(),
      null
    ).then(result => {
      if (result.status !== 200) {
        return Promise.reject(new Error('Error: ' + result.status))
      } else {
        return Promise.resolve()
      }
    })
  }
}

module.exports = Tags
