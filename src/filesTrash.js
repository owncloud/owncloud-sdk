var Promise = require('promise')
const dav = require('davclient.js')

/**
 * @class FilesTrash
 * @classdesc
 * <b><i> The FilesTrash class has all the methods for ownCloud trashbin management.</i></b><br><br>
 *
 * @version 1.0.0
 * @param   {helpers}    helperFile  instance of the helpers class
 */
class FilesTrash {
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
   * Returns the listing/contents of the trashbin
   * @param   {string}    path          path of the file/folder at OC instance
   * @param   {string}    depth         0: only file/folder, 1: upto 1 depth, infinity: infinite depth
   * @param   {array}     properties    Array[string] with dav properties to be requested
   * @returns {Promise.<fileInfo>}      Array[objects]: each object is an instance of class fileInfo
   * @returns {Promise.<error>}         string: error message, if any.
   */
  list (path, depth, properties) {
    if (typeof depth === 'undefined') {
      depth = 1
    }

    if (typeof properties === 'undefined') {
      properties = [
        '{http://owncloud.org/ns}trashbin-original-filename',
        '{http://owncloud.org/ns}trashbin-original-location',
        '{http://owncloud.org/ns}trashbin-delete-timestamp',
        '{DAV:}getcontentlength',
        '{DAV:}resourcetype'
      ]
    }

    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    const headers = this.helpers.buildHeaders()
    const target = '/trash-bin/' + this.helpers.getCurrentUser().id + '/items/' + path

    return this.davClient.propFind(this.helpers._buildFullWebDAVPathV2(target), properties, depth, headers).then(result => {
      if (result.status !== 207) {
        const error = this.helpers._parseDAVerror(result.xhr.response)
        return Promise.reject(new Error('Error: ' + result.status + ' - ' + error))
      } else {
        return Promise.resolve(this.helpers._parseBody(result.body))
      }
    })
  }

  /**
   * Clears the users trashbin
   * @returns {*|Promise<T | never>|*}
   */
  clearTrashBin () {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    const headers = this.helpers.buildHeaders()
    const target = '/trash-bin/' + this.helpers.getCurrentUser().id + '/items/'

    return this.davClient.request('DELETE', this.helpers._buildFullWebDAVPathV2(target), headers).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve()
      } else {
        const error = this.helpers._parseDAVerror(result.xhr.response)
        return Promise.reject(new Error('Error: ' + result.status + ' - ' + error))
      }
    })
  }

  /**
   * Restores an item to it's original location.
   * @param fileId
   * @returns {*|Promise<T | never>|*}
   */
  restore (fileId) {
    if (fileId === 'undefined') {
      return Promise.reject(new Error('No fileId given for restore'))
    }
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    const headers = this.helpers.buildHeaders()
    const source = '/trash-bin/' + this.helpers.getCurrentUser().id + '/items/' + fileId
    const target = '/trash-bin/' + this.helpers.getCurrentUser().id + '/restore/void'

    headers['Destination'] = this.helpers._buildFullWebDAVPathV2(target)
    return this.davClient.request('MOVE', this.helpers._buildFullWebDAVPathV2(source), headers).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve()
      } else {
        return Promise.reject(this.helpers._parseDAVerror(result.body))
      }
    })
  }
}

module.exports = FilesTrash
