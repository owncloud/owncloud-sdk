const path = require('path')
const convert = require('xml-js')
const httpHelper = require('./httpHelper')
const {
  encodeURIPath
} = require('./pactHelper.js')

/**
 *
 * @param {string} userId
 * @param {string} element
 * @param {string} type (files|versions)
 */
const createDavPath = function (userId, element, type = 'files') {
  const parts = []
  if (type === 'versions') {
    parts.push('meta', element, 'v')
  } else {
    parts.push(type, userId, encodeURIPath(element))
  }
  return path.join(...parts)
}

/**
 * Create a folder using webDAV api.
 *
 * @param {string} user
 * @param {string} folderName
 * @returns {[]} all fetch results
 */
const createFolderRecursive = function (user, folderName) {
  const results = []
  folderName = folderName.replace(/\/$/, '')
  folderName = folderName.replace(/^\//, '')
  const folders = folderName.split(path.sep)
  for (let i = 0; i < folders.length; i++) {
    let recursivePath = ''
    for (let j = 0; j <= i; j++) {
      recursivePath += path.sep + folders[j]
    }
    results[i] = httpHelper.mkcol(
      createDavPath(user, recursivePath),
      null,
      null,
      user
    )
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
  return httpHelper.put(createDavPath(user, fileName), contents, null, user)
}

/**
 * Delete a file or folder using webDAV api.
 *
 * @param {string} user
 * @param {string} itemName
 * @returns {*} result of the fetch request
 */
const deleteItem = function (user, itemName) {
  return httpHelper.delete(createDavPath(user, itemName), null, null, user)
}

const getFileId = function (user, password, itemName) {
  const fileIdResult = httpHelper.propfind(
    createDavPath(user, itemName),
    '<?xml version="1.0"?>' +
      '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">' +
      '<d:prop><oc:fileid /></d:prop>' +
      '</d:propfind>',
    null,
    user
  )

  if (fileIdResult.status !== 207) {
    throw new Error(`could not get fileId for '${itemName}'`)
  }
  return fileIdResult.text().match(/<oc:fileid>([^<]*)<\/oc:fileid>/)[1]
}

const listVersionsFolder = function (user, password, fileId) {
  const listResult = httpHelper.propfind(
    createDavPath(user, fileId, 'versions'),
    null,
    null,
    user
  )
  if (listResult.status !== 207) {
    throw new Error(`could not list versions folder of fileId '${fileId}'`)
  }
  return listResult.text()
}

const getSignKey = function (username, password) {
  const response = httpHelper.getOCS(
    '/cloud/user/signing-key',
    null,
    null,
    username
  )
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
const propfind = function (path, userId, properties, type = 'files', folderDepth = '1') {
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

  const result = httpHelper.propfind(
    createDavPath(userId, path, type),
    body,
    { Depth: folderDepth },
    userId
  )
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
 * @param {number|string} depth
 */
const getTrashBinElements = function (user, depth = '1') {
  const str = propfind(
    '/',
    user,
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

/**
 * favorites a file
 * @param {string} username
 * @param {string} password
 * @param {string} fileName
 * @returns {*} result of the fetch request
 */
const markAsFavorite = function (username, password, fileName) {
  return httpHelper.proppatch(
    createDavPath(username, fileName),
    '<?xml version="1.0"?>' +
      '<d:propertyupdate  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">' +
      '<d:set><d:prop>' +
      '<oc:favorite>true</oc:favorite>' +
      '</d:prop></d:set>' +
      '</d:propertyupdate>',
    null,
    username
  )
}

/**
 * creates a system tag
 * @param {string} username
 * @param {string} password
 * @param {string} tag tag name
 * @returns {*} result of the fetch request
 */
const createASystemTag = function (username, password, tag) {
  return httpHelper.post(
    '/systemtags',
    JSON.stringify({
      name: tag,
      canAssign: true,
      userEditable: true,
      userAssignable: true,
      userVisible: true
    }),
    { 'Content-Type': 'application/json' },
    username
  )
}

/**
 * assigns a tag to a file
 * @param {string} username
 * @param {string} password
 * @param {string} fileName
 * @param {string} tagName
 * @returns {*} result of the fetch request
 */
const assignTagToFile = function (username, password, fileName, tagName) {
  const fileId = getFileId(username, password, fileName)
  const tagId = getTagId(username, password, tagName)
  return httpHelper.put(
    `/systemtags-relations/files/${fileId}/${tagId}`,
    null,
    null,
    username
  )
}

/**
 * gets tagid by tagName
 * @param {string} username
 * @param {string} password
 * @param {string} tagName
 * @returns {*} result of the fetch request
 */
const getTagId = function (username, password, tagName) {
  const xmlReq = '<?xml version="1.0" encoding="utf-8" ?>' +
    '<a:propfind xmlns:a="DAV:" xmlns:oc="http://owncloud.org/ns">' +
    '<a:prop><oc:display-name/><oc:id/></a:prop></a:propfind>'

  const res = httpHelper.propfind('/systemtags', xmlReq, null, username)

  if (res.status !== 207) {
    throw new Error('could not get tags list')
  }
  /* eslint-disable-next-line no-useless-escape */
  const regex = '<oc:display-name>' + tagName + '<\/oc:display-name><oc:id>[0-9]+<\/oc:id>'
  return res.text().match(regex)[0].match(/<oc:id>([^<]*)<\/oc:id>/)[1]
}

module.exports = {
  createFolderRecursive,
  createFile,
  deleteItem,
  getFileId,
  listVersionsFolder,
  createDavPath,
  getSignKey,
  getTrashBinElements,
  markAsFavorite,
  createASystemTag,
  assignTagToFile,
  getTagId
}
