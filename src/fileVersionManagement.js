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

module.exports = FilesVersions
