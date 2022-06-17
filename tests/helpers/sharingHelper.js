const httpHelper = require('./httpHelper')
const {
  applicationFormUrlEncoded,
  encodeURIPath,
  getPublicLinkAuthHeader
} = require('./pactHelper.js')
const config = require('../config/config.json')

const sharesEndPoint = '/apps/files_sharing/api/v1/shares'
const publicFilesEndPoint = '/public-files'

/**
 * share a file or folder using webDAV api.
 *
 * @param {string} username
 * @param {object} shareParams
 * @returns {*} result of the fetch request
 */
const shareResource = function (username, shareParams) {
  const params = validateParams(shareParams)
  return httpHelper.postOCS(
    sharesEndPoint,
    params,
    applicationFormUrlEncoded,
    username
  )
}

/**
 * get shares of a file/folder
 *
 * @param {string} username
 * @param {string} userPassword
 * @param {string} path
 * @returns {*} result of the fetch request
 */
const getShareInfoByPath = function (username, userPassword, path) {
  return httpHelper.getOCS(
    `${sharesEndPoint}?path=${encodeURIPath(path)}`,
    null,
    null,
    username
  )
}

/**
 *
 * @param {object} data
 * @returns {string}
 */
const validateParams = function (data) {
  const params = new URLSearchParams()
  if (data) {
    for (const key in data) {
      let value = data[key]
      if (key === 'publicUpload' || key === 'shareType') {
        if (value !== undefined && value !== null && value !== '') {
          value = value.toString().toLowerCase()
          params.append(key, value)
        }
      } else {
        if (value) {
          params.append(key, value)
        }
      }
    }
  }

  return params
}

/**
 * creates folder in the last shared public share
 *
 * @param {string} token
 * @param {string} folderName
 * @param {string} password
 * @returns {*} result of the fetch request
 */
const createFolderInLastPublicShare = function (token, folderName, password) {
  return httpHelper.mkcol(`${publicFilesEndPoint}/${token}/${folderName}`, null, getPublicLinkAuthHeader(password))
}

/**
 * creates file in the last shared public share
 *
 * @param {string} token
 * @param {string} fileName
 * @param {string} password
 * @param {string} content
 * @returns {*} result of the fetch request
 */
const createFileInLastPublicShare = function (token, fileName, password, content = 'a file') {
  return httpHelper.put(`${publicFilesEndPoint}/${token}/${fileName}`, content, getPublicLinkAuthHeader(password))
}

/**
 * convert JS object to form url encoded data.
 *
 * @param {object} obj
 * @returns {string}
 */
const toFormUrlEncoded = function (obj) {
  if (obj) {
    for (const key in obj) {
      let value = obj[key]
      if (key === 'publicUpload') {
        value = obj[key].toString().toLowerCase()
      }
      return `${key}=${value}`
    }
  }
}

/**
 * @param {sring} resource
 * @param {sring} resourceType
 *
 * @returns {object} shareId and shareToken
 */
const getShareIdToken = (resource, resourceType) => {
  let shareId, shareToken
  if (resourceType === 'folder') {
    shareId = config.testFolderId
    shareToken = config.shareTokenOfPublicLinkFolder
  } else {
    const iteration = config.testFiles.indexOf(resource)
    shareId = config.testFilesId[iteration]
    shareToken = config.testFilesToken[iteration]
  }
  return { shareId, shareToken }
}

module.exports = {
  shareResource,
  getShareInfoByPath,
  createFolderInLastPublicShare,
  createFileInLastPublicShare,
  toFormUrlEncoded,
  getShareIdToken
}
