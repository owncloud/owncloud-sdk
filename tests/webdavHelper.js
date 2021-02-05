const fetch = require('sync-fetch')
const path = require('path')
const {
  getAuthHeaders
} = require('./pactHelper.js')

/**
 *
 * @param {string} userId
 * @param {string} element
 */
const createDavPath = function (userId, element) {
  return `/remote.php/dav/files/${userId}/${element}`
}

/**
 * returns the full and sanitized URL of the dav resource
 * @param {string} userId
 * @param {string} resource
 * @returns {string}
 */
const createFullDavUrl = function (userId, resource) {
  return (process.env.PROVIDER_BASE_URL + createDavPath(userId, resource))
    .replace(/([^:])\/{2,}/g, '$1/')
}

/**
 * Create a folder using webDAV api.
 *
 * @param {string} user
 * @param {string} password
 * @param {string} folderName
 * @returns {[]} all fetch results
 */
const createFolderRecrusive = function (user, password, folderName) {
  const results = []
  const folders = folderName.split(path.sep)
  for (let i = 0; i < folders.length; i++) {
    let recrusivePath = ''
    for (let j = 0; j <= i; j++) {
      recrusivePath += path.sep + folders[j]
    }
    results[i] = fetch(createFullDavUrl(user, recrusivePath), {
      method: 'MKCOL',
      headers: { authorization: getAuthHeaders(user, password) }
    })
  }
  return results
}

/**
 * Create a file using webDAV api.
 *
 * @param {string} user
 * @param {string} password
 * @param {string} fileName
 * @param {string} contents
 * @returns {*} result of the fetch request
 */
const createFile = function (user, password, fileName, contents = '') {
  return fetch(createFullDavUrl(user, fileName), {
    method: 'PUT',
    headers: { authorization: getAuthHeaders(user, password) },
    body: contents
  })
}

/**
 * Delete a file or folder using webDAV api.
 *
 * @param {string} user
 * @param {string} password
 * @param {string} itemName
 * @returns {*} result of the fetch request
 */
const deleteItem = function (user, password, itemName) {
  return fetch(createFullDavUrl(user, itemName), {
    method: 'DELETE',
    headers: { authorization: getAuthHeaders(user, password) }
  })
}

module.exports = {
  createFolderRecrusive,
  createFile,
  deleteItem
}
