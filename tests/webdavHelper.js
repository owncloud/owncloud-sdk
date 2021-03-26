const fetch = require('sync-fetch')
const path = require('path')
const convert = require('xml-js')
const {
  getAuthHeaders,
  getProviderBaseUrl
} = require('./pactHelper.js')

/**
 *
 * @param {string} userId
 * @param {string} element
 * @param {string} type (files|versions)
 */
const createDavPath = function (userId, element, type = 'files') {
  const parts = ['/remote.php/dav']
  if (type === 'versions') {
    parts.push('meta', element, 'v')
  } else {
    parts.push(type, userId, element)
  }
  return path.join(...parts)
}

/**
 * returns the full and sanitized URL of the dav resource
 * @param {string} userId
 * @param {string} resource
 * @param {string} type (files|versions)
 * @returns {string}
 */
const createFullDavUrl = function (userId, resource, type = 'files') {
  return (getProviderBaseUrl() + createDavPath(userId, resource, type))
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
  folderName = folderName.replace(/\/$/, '')
  folderName = folderName.replace(/^\//, '')
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

const getFileId = function (user, password, itemName) {
  const fileIdResult = fetch(createFullDavUrl(user, itemName), {
    method: 'PROPFIND',
    body: '<?xml version="1.0"?>' +
          '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">' +
          '<d:prop><oc:fileid /></d:prop>' +
          '</d:propfind>',
    headers: { authorization: getAuthHeaders(user, password) }
  })
  if (fileIdResult.status !== 207) {
    throw new Error(`could not get fileId for '${itemName}'`)
  }
  return fileIdResult.text().match(/<oc:fileid>([^<]*)<\/oc:fileid>/)[1]
}

const listVersionsFolder = function (user, password, fileId) {
  const listResult = fetch(createFullDavUrl(user, fileId, 'versions'), {
    method: 'PROPFIND',
    headers: { authorization: getAuthHeaders(user, password) }
  })
  if (listResult.status !== 207) {
    throw new Error(`could not list versions folder of fileId '${fileId}'`)
  }
  return listResult.text()
}

const getSignKey = function (username, password) {
  const endpoint = getProviderBaseUrl() + '/ocs/v1.php/cloud/user/signing-key?format=json'
  const response = fetch(endpoint, {
    method: 'GET',
    headers: {
      authorization: getAuthHeaders(username, password)
    }
  })
  if (response.status !== 200) {
    throw new Error(`Could not get signed Key for username ${username}`)
  }
  return response.json().ocs.data['signing-key']
}

/**
 *
 * @param {string} path
 * @param {string} userId
 * @param {array} properties
 * @param {string} type
 * @param {number} folderDepth
 */
const propfind = function (path, userId, password, properties, type = 'files', folderDepth = '1') {
  let propertyBody = ''
  properties.map(prop => {
    propertyBody += `<${prop}/>`
  })
  const body = `<?xml version="1.0"?>
                <d:propfind
                xmlns:d="DAV:"
                xmlns:oc="http://owncloud.org/ns"
                xmlns:ocs="http://open-collaboration-services.org/ns">
                <d:prop>${propertyBody}</d:prop>
                </d:propfind>`

  const result = fetch(createFullDavUrl(userId, path, type), {
    method: 'PROPFIND',
    body,
    headers: { authorization: getAuthHeaders(userId, password), Depth: folderDepth }
  })
  if (result.status !== 207) {
    throw new Error('could not list trashbin folders')
  }
  return result.text()
}

/**
 * Get the list of trashbin items for a user
 * in following format
 * [{
 *  "href":
 *  "originalFilename":
 *  "originalLocation":
 *  "deleteTimestamp":
 *  "lastModified":
 * },...]
 *
 * @param {string} user
 * @param {string} password
 * @param {number} depth
 */
const getTrashBinElements = function (user, password, depth = 2) {
  const str = propfind(
    '/',
    user,
    password,
    [
      'oc:trashbin-original-filename',
      'oc:trashbin-original-location',
      'oc:trashbin-delete-timestamp',
      'd:getlastmodified'
    ],
    'trash-bin',
    depth
  )
  const trashData = convert.xml2js(str, { compact: true })['d:multistatus']['d:response']
  const trashItems = []
  trashData.map(trash => {
    let propstat
    if (Array.isArray(trash['d:propstat'])) {
      propstat = trash['d:propstat'][0]
    } else {
      propstat = trash['d:propstat']
    }
    if (propstat['d:prop'] === undefined) {
      throw new Error('trashbin data not defined')
    } else {
      trashItems.push({
        href: trash?.['d:href']._text,
        originalFilename: propstat['d:prop']['oc:trashbin-original-filename'] ? propstat['d:prop']['oc:trashbin-original-filename']._text : '',
        originalLocation: propstat['d:prop']['oc:trashbin-original-location'] ? propstat['d:prop']['oc:trashbin-original-location']._text : '',
        deleteTimestamp: propstat['d:prop']['oc:trashbin-delete-timestamp'] ? propstat['d:prop']['oc:trashbin-delete-timestamp']._text : '',
        lastModified: propstat['d:prop']['d:getlastmodified'] ? propstat['d:prop']['d:getlastmodified']._text : ''
      })
    }
  })
  return trashItems
}

module.exports = {
  createFolderRecrusive,
  createFile,
  deleteItem,
  getFileId,
  listVersionsFolder,
  createDavPath,
  getSignKey,
  getTrashBinElements
}
