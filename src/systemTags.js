var Promise = require('promise')
const dav = require('davclient.js')

/**
 * @class SystemTags
 * @classdesc
 * <b><i> The SystemTags class, has all the methods for ownCloud system tags management.</i></b><br><br>
 *
 * @version 1.0.0
 * @param   {helpers}    helperFile  instance of the helpers class
 */
class SystemTags {
  constructor (helperFile) {
    this.helpers = helperFile
    this.davClient = new dav.Client({
      baseUrl: this.helpers._webdavUrl,
      xmlNamespaces: {
        'DAV:': 'd',
        'http://owncloud.org/ns': 'oc'
      }
    })
  }

  /**
   * Create a new system tag
   * @param   {string}    tagInfo          the tag info
   * @returns {Promise.<number>}              id of the newly created system tag
   * @returns {Promise.<error>}            string: error message, if any.
   */
  createTag (tagInfo) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    const defaults = {
      canAssign: true,
      name: '',
      userAssignable: true,
      userEditable: true,
      userVisible: true
    }
    tagInfo = Object.assign({}, defaults, tagInfo)
    if (tagInfo.name === '') {
      return Promise.reject('Please specify a name for the tag.')
    }

    const headers = this.helpers.buildHeaders()
    headers['Content-Type'] = 'application/json'
    const body = JSON.stringify(tagInfo)

    return this.davClient.request('POST', this.helpers._buildFullWebDAVPathV2('systemtags'), headers, body, '').then(result => {
      if (result.status !== 201) {
        return Promise.reject(new Error('Error: ' + result.status))
      } else {
        const contentLocation = result.xhr.getResponseHeader('Content-Location')
        return Promise.resolve(parseInt(contentLocation.substr(contentLocation.lastIndexOf('/') + 1), 10))
      }
    })
  }

  /**
   * Assign a tag to a file/folder
   * @param   {number}   fileId            id of the file/folder
   * @param   {number}   tagId             id of the tag
   * @returns {Promise}                    resolves if successful
   * @returns {Promise.<error>}            string: error message, if any.
   */
  tagFile (fileId, tagId) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }
    const path = 'systemtags-relations/files/' + fileId + '/' + tagId

    return this.davClient.request('PUT',
      this.helpers._buildFullWebDAVPathV2(path),
      this.helpers.buildHeaders()).then(result => {
      if (result.status !== 201) {
        return Promise.reject(new Error('Error: ' + result.status))
      } else {
        return Promise.resolve()
      }
    })
  }
}

module.exports = SystemTags
