const fetch = require('sync-fetch')
const {
  getAuthHeaders,
  applicationFormUrlEncoded,
  sanitizeUrl
} = require('../pactHelper.js')

const shareEndPoint = '/ocs/v1.php/apps/files_sharing/api/v1/shares'
const publicFilesEndPoint = '/remote.php/dav/public-files'

/**
 * returns the full and sanitized URL of the dav resource
 *
 * @returns {string}
 */
const getSharingEndPoint = function () {
  return sanitizeUrl(process.env.PROVIDER_BASE_URL + shareEndPoint)
}

/**
 * returns the full and sanitized URL of public-files
 *
 * @returns {string}
 */
const getPublicFilesEndPoint = function () {
  return sanitizeUrl(process.env.PROVIDER_BASE_URL + publicFilesEndPoint)
}

/**
 * share a file or folder using webDAV api.
 *
 * @param {string} username
 * @param {string} userPassword
 * @param {string} path
 * @param {number} shareType
 * @param {string} shareWith
 * @param {number} permissions
 * @param {string} name
 * @param {boolean} publicUpload
 * @param {string} password
 * @param {Date} expireDate
 * @returns {*} result of the fetch request
 */
const shareResource = function (
  username,
  userPassword,
  path,
  shareType,
  shareWith,
  permissions,
  name,
  publicUpload,
  password,
  expireDate
) {
  const params = validateParams({
    path, shareType, shareWith, permissions, name, publicUpload, password, expireDate
  })
  return fetch(getSharingEndPoint() + '?format=json', {
    method: 'POST',
    body: params,
    headers: {
      authorization: getAuthHeaders(username, userPassword),
      ...applicationFormUrlEncoded
    }
  })
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
  return fetch(getSharingEndPoint() + `?path=${encodeURIComponent(path)}&format=json`, {
    method: 'GET',
    headers: {
      authorization: getAuthHeaders(username, userPassword)
    }
  })
}

/**
 *
 * @param {object} data
 * @returns {string}
 */
const validateParams = function (data) {
  const params = new URLSearchParams()
  if (data) {
    if (data.path) {
      params.append('path', data.path)
    }
    if (data.shareType !== undefined && data.shareType !== null && data.shareType !== '') {
      params.append('shareType', data.shareType)
    }
    if (data.shareWith) {
      params.append('shareWith', data.shareWith)
    }
    if (data.permissions) {
      params.append('permissions', data.permissions)
    }
    if (data.name) {
      params.append('name', data.name)
    }
    if (data.password) {
      params.append('password', data.password)
    }
    if (data.expireDate) {
      params.append('expireDate', data.expireDate)
    }
    if (data.publicUpload !== undefined && data.publicUpload !== null && data.publicUpload !== '') {
      params.append('publicUpload', data.publicUpload.toString().toLowerCase())
    }
  }

  return params
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
  getShareInfoByPath,
  createFolderInLastPublicShare,
  createFileInLastPublicShare
}
