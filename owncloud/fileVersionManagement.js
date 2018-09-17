var Promise = require('promise')
var dav = require('davclient.js')
var helpers
var davClient

/**
 * @class files
 * @classdesc
 * <b><i> The files class, has all the methods for your owncloud files management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *  <li><b>Files Management</b>
 *      <ul>
 *          <li>list</li>
 *          <li>getFileContents</li>
 *          <li>putFileContents</li>
 *          <li>mkdir</li>
 *          <li>createFolder</li>
 *          <li>delete</li>
 *          <li>fileInfo</li>
 *          <li>getFile</li>
 *          <li>getDirectoryAsZip</li>
 *          <li>putFile</li>
 *          <li>putDirectory</li>
 *          <li>move</li>
 *          <li>copy</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Vincent Petry
 * @version 1.0.0
 * @param   {object}    helperFile  instance of the helpers class
 */
function files (helperFile) {
  helpers = helperFile
  davClient = new dav.Client({
    baseUrl: helpers._webdavUrl
  })
}

/**
 * Returns a list of versions for the given file id
 * @param   {string}    fileId        file id
 * @returns {Promise.<fileInfo>}      Array[objects]: each object is an instance of class fileInfo
 * @returns {Promise.<error>}         string: error message, if any.
 */
files.prototype.listVersions = function (fileId) {
  const path = '/dav/meta/' + fileId + '/v'

  return new Promise((resolve, reject) => {
    davClient.propFind(helpers._buildFullWebDAVPathV2(path), [], 0, {
      'Authorization': helpers.getAuthorization()
    }).then(result => {
      if (result.status !== 207) {
        resolve(null)
      } else {
        // TODO: convert body into file objects as expected
        resolve(this._parseBody(result.body))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

module.exports = files
