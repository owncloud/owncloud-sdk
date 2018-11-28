var Promise = require('promise')
var dav = require('davclient.js')
var helpers
var davClient

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
 * @author Vincent Petry
 * @version 1.0.0
 * @param   {object}    helperFile  instance of the helpers class
 */
function FilesVersions (helperFile) {
  helpers = helperFile
  davClient = new dav.Client({
    baseUrl: helpers._webdavUrl,
    xmlNamespaces: {
      'DAV:': 'd',
      'http://owncloud.org/ns': 'oc'
    }
  })
}

/**
 * Returns a list of versions for the given file id
 * @param   {string}    fileId        file id
 * @returns {Promise.<fileInfo>}      Array[objects]: each object is an instance of class fileInfo
 * @returns {Promise.<error>}         string: error message, if any.
 */
FilesVersions.prototype.listVersions = function (fileId) {
  const path = '/meta/' + fileId + '/v'

  return new Promise((resolve, reject) => {
    davClient.propFind(helpers._buildFullWebDAVPathV2(path), [], 1, {
      'Authorization': helpers.getAuthorization()
    }).then(result => {
      if (result.status !== 207) {
        resolve(null)
      } else {
        resolve(helpers._parseBody(result.body).splice(1))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Returns the content of a version of a remote file version
 * @param   {string}  fileId     id of the remote file at OC instance
 * @param   {string}  versionId  id of the version of the remote file at OC instance
 */
FilesVersions.prototype.getFileVersionContents = function (fileId, versionId) {
  const path = '/meta/' + fileId + '/v/' + versionId

  return new Promise((resolve, reject) => {
    // TODO: use davclient ?
    helpers._get(helpers._buildFullWebDAVPathV2(path)).then(data => {
      var response = data.response
      var body = data.body

      if (response.statusCode === 200) {
        resolve(body)
      } else {
        var err = helpers._parseDAVerror(body)
        reject(err)
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Restores a version of a remote file version
 * @param   {string}  fileId     id of the remote file at OC instance
 * @param   {string}  versionId  id of the version of the remote file at OC instance
 * @param   {string}  targetPath path of the remote file at OC instance
 */
FilesVersions.prototype.restoreFileVersion = (fileId, versionId, targetPath) => {
  return new Promise((resolve, reject) => {
    if (!helpers.getAuthorization()) {
      reject('Please specify an authorization first.')
      return
    }

    const source = '/meta/' + fileId + '/v/' + versionId
    const target = '/files/' + helpers.getCurrentUser().id + '/' + targetPath

    davClient.request('COPY', helpers._buildFullWebDAVPathV2(source), {
      'Authorization': helpers.getAuthorization(),
      'Destination': helpers._buildFullWebDAVPathV2(target)
    }).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        resolve(true)
      } else {
        reject(helpers._parseDAVerror(result.body))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Returns the url of a remote file version
 * @param   {string}  fileId     id of the remote file at OC instance
 * @param   {string}  versionId  id of the version of the remote file at OC instance
 * @returns {string}             Url of the remote file version
 */
FilesVersions.prototype.getFileVersionUrl = function (fileId, versionId) {
  const source = '/meta/' + fileId + '/v/' + versionId
  return helpers._buildFullWebDAVPathV2(source)
}

module.exports = FilesVersions
