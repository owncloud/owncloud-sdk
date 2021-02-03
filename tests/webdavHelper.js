const fetch = require('sync-fetch')
const path = require('path')
const {
  validAuthHeaders
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
 * Create a folder using webDAV api.
 *
 * @param {string} user
 * @param {string} folderName
 * @returns {[]} all fetch results
 */
const createFolderRecrusive = function (user, folderName) {
  const results = []
  const folders = folderName.split(path.sep)
  for (let i = 0; i < folders.length; i++) {
    let recrusivePath = ''
    for (let j = 0; j <= i; j++) {
      recrusivePath += path.sep + folders[j]
    }
    const davPath = createDavPath(user, recrusivePath)
    results[i] = fetch(process.env.PROVIDER_BASE_URL + davPath, {
      method: 'MKCOL',
      headers: validAuthHeaders
    })
  }
  return results
}

/**
 * Create a file using webDAV api.
 *
 * @param {string} user
 * @param {string} fileName
 * @param {string} contents
 * @returns {*} result of the fetch request
 */
const createFile = function (user, fileName, contents = '') {
  const davPath = createDavPath(user, fileName)
  return fetch(process.env.PROVIDER_BASE_URL + davPath, {
    method: 'PUT',
    headers: validAuthHeaders,
    body: contents
  })
}

/**
 * Delete a file or folder using webDAV api.
 *
 * @param {string} user
 * @param {string} itemName
 * @returns {*} result of the fetch request
 */
const deleteItem = function (user, itemName) {
  const davPath = createDavPath(user, itemName)
  return fetch(process.env.PROVIDER_BASE_URL + davPath, {
    method: 'DELETE',
    headers: validAuthHeaders
  })
}

module.exports = {
  createFolderRecrusive,
  createFile,
  deleteItem
}
