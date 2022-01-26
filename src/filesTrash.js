const Promise = require('promise')
const { Dav } = require('./dav')

/**
 * @class FilesTrash
 * @classdesc
 * <b><i> The FilesTrash class has all the methods for ownCloud trash-bin management.</i></b><br><br>
 *
 * @version 1.0.0
 * @param   {helpers}    helperFile  instance of the helpers class
 */
class FilesTrash {
  constructor (helperFile) {
    this.helpers = helperFile
    this.davClient = new Dav(this.helpers._davPath)
  }

  /**
   * Returns the listing/contents of the trash-bin
   * @param   {string}    path          path of the file/folder at OC instance
   * @param   {string}    depth         0: only file/folder, 1: upto 1 depth, infinity: infinite depth
   * @param   {array}     properties    Array[string] with dav properties to be requested
   * @param   {Object}    query         Query parameters dictionary
   * @returns {Promise.<fileInfo | string | Error>}
   */
  list (path, depth = '1', properties = undefined, query = undefined) {
    if (properties === undefined) {
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
    const target = '/trash-bin/' + this.helpers.getCurrentUser().id + '/' + path

    return this.davClient.propFind(
      this.helpers._buildFullDAVPath(target),
      properties,
      depth,
      headers
    ).then(result => {
      if (result.status !== 207) {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
      } else {
        return Promise.resolve(this.helpers._parseBody(result.body))
      }
    })
  }

  /**
   * Clears the users trash-bin
   * @param   {?string} item
   * @param   {Object}  query Query parameters dictionary
   * @returns {Promise<void | string | Error>}
   */
  clearTrashBin (item = null, query = undefined) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    const headers = this.helpers.buildHeaders()
    let target = '/trash-bin/' + this.helpers.getCurrentUser().id + '/'
    if (item !== null) {
      target += item
    }

    return this.davClient.request(
      'DELETE',
      this.helpers._buildFullDAVPath(target),
      headers,
      null,
      {
        version: 'v2',
        query: query
      }
    ).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve()
      } else {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.res.data))
      }
    })
  }

  /**
   * Restores an item to it's original location.
   * @param   {string|number} fileId
   * @param   {string}        originalLocation
   * @param   {boolean}       overWrite
   * @param   {Object}        query            Query parameters dictionary
   * @returns {Promise<void | string | Error>}
   */
  restore (fileId, originalLocation, overWrite = false, query = undefined) {
    if (fileId === undefined) {
      return Promise.reject(new Error('No fileId given for restore'))
    }
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    const headers = this.helpers.buildHeaders()
    const source = '/trash-bin/' + this.helpers.getCurrentUser().id + '/' + fileId
    const target = '/files/' + this.helpers.getCurrentUser().id + '/' + originalLocation

    headers.Destination = this.helpers._buildFullDAVURL(target)
    headers.Overwrite = overWrite ? 'T' : 'F'
    return this.davClient.request(
      'MOVE',
      this.helpers._buildFullDAVPath(source),
      headers,
      null,
      {
        query: query
      }
    ).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve()
      } else {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.res.data))
      }
    })
  }
}

module.exports = FilesTrash
