const Promise = require('promise')
const { Dav } = require('./dav')

/**
 * @class FilesVersions
 * @classdesc
 * <b><i> The FilesVersions class, has all the methods for your ownCloud files version management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *  <li><b>Files Versions Management</b>
 *      <ul>
 *          <li>listVersions</li>
 *          <li>getFileVersionContents</li>
 *          <li>restoreFileVersion</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Thomas Müller
 * @version 1.0.0
 * @param   {object}    helperFile  instance of the helpers class
 */
class FilesVersions {
  constructor (helperFile) {
    this.helpers = helperFile
    this.davClient = new Dav(this.helpers._davPath)
  }

  /**
   * Returns a list of versions for the given file id
   * @param   {string|number}      fileId        file id
   * @returns {Promise.<fileInfo>}               Array[objects]: each object is an instance of class fileInfo
   * @returns {Promise.<error>}                  string: error message, if any.
   */
  listVersions (fileId) {
    const path = '/meta/' + fileId + '/v'
    const headers = this.helpers.buildHeaders()
    return this.davClient.propFind(this.helpers._buildFullDAVPath(path), [], 1, headers).then(result => {
      if (result.status !== 207) {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result, result.status, result.body))
      } else {
        return Promise.resolve(this.helpers._parseBody(result.body).splice(1))
      }
    })
  }

  /**
   * Returns the content of a version of a remote file version
   * @param   {string}  fileId     id of the remote file at OC instance
   * @param   {string}  versionId  id of the version of the remote file at OC instance
   */
  getFileVersionContents (fileId, versionId) {
    const path = '/meta/' + fileId + '/v/' + versionId

    return this.helpers._get(this.helpers._buildFullDAVURL(path)).then(data => {
      const response = data.response
      const body = data.body

      if (response.statusCode === 200) {
        return Promise.resolve(body)
      } else {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(response, response.status, body))
      }
    })
  }

  /**
   * Restores a version of a remote file version
   * @param   {string}  fileId     id of the remote file at OC instance
   * @param   {string}  versionId  id of the version of the remote file at OC instance
   * @param   {string}  targetPath path of the remote file at OC instance
   */
  restoreFileVersion (fileId, versionId, targetPath) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    const source = '/meta/' + fileId + '/v/' + versionId
    const target = '/files/' + this.helpers.getCurrentUser().id + '/' + targetPath

    return this.davClient.request('COPY', this.helpers._buildFullDAVPath(source), {
      ...this.helpers.buildHeaders(),
      Destination: this.helpers._buildFullDAVURL(target)
    }, null, { version: 'v2' }).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      } else {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result, result.status, result.body))
      }
    })
  }

  /**
   * Returns the url of a remote file version
   * @param   {string|number}  fileId     id of the remote file at OC instance
   * @param   {string|number}  versionId  id of the version of the remote file at OC instance
   * @returns {string}                    Url of the remote file version
   */
  getFileVersionUrl (fileId, versionId) {
    const source = '/meta/' + fileId + '/v/' + versionId
    return this.helpers._buildFullDAVURL(source)
  }
}

module.exports = FilesVersions
