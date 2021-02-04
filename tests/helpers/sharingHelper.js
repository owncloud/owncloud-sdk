const fetch = require('sync-fetch')
const {
  getAuthHeaders,
  applicationFormUrlEncoded
} = require('../pactHelper.js')

const shareEndPoint = '/ocs/v1.php/apps/files_sharing/api/v1/shares'
const publicFilesEndPoint = '/remote.php/dav/public-files'

/**
 * returns the full and sanitized URL of the dav resource
 *
 * @returns {string}
 */
const getSharingEndPoint = function () {
  return (process.env.PROVIDER_BASE_URL + shareEndPoint)
    .replace(/([^:])\/{2,}/g, '$1/')
}

/**
 * returns the full and sanitized URL of public-files
 *
 * @returns {string}
 */
const getPublicFilesEndPoint = function () {
  return (process.env.PROVIDER_BASE_URL + publicFilesEndPoint)
    .replace(/([^:])\/{2,}/g, '$1/')
}

/**
 * share a file or folder using webDAV api.
 *
 * @param {string} username
 * @param {string} password
 * @param {string} path
 * @param {number} shareType
 * @param {string} shareWith
 * @param {number} permissions
 * @returns {*} result of the fetch request
 */
const shareResource = function (username, password, path, shareType, shareWith, permissions) {
  return fetch(getSharingEndPoint() + '?format=json', {
    method: 'POST',
    body: `path=${path}&shareType=${shareType}&sharewith=${shareWith}&permissions=${permissions}`,
    headers: {
      authorization: getAuthHeaders(username, password),
      ...applicationFormUrlEncoded
    }
  })
}

/**
 * creates folder in the last shared public share
 *
 * @param {string} token
 * @param {string} folderName
 * @returns {*} result of the fetch request
 */
const createFolderInLastPublicShare = function (token, folderName) {
  return fetch(getPublicFilesEndPoint() + `/${token}/${folderName}?format=json`, {
    method: 'MKCOL'
  })
}

/**
 * creates file in the last shared public share
 *
 * @param {string} token
 * @param {string} fileName
 * @returns {*} result of the fetch request
 */
const createFileInLastPublicShare = function (token, fileName) {
  return fetch(getPublicFilesEndPoint() + `/${token}/${fileName}?format=json`, {
    method: 'PUT',
    body: 'a file'
  })
}

module.exports = {
  shareResource,
  createFolderInLastPublicShare,
  createFileInLastPublicShare
}
