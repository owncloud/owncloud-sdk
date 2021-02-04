const config = require('../config/config.json')

/**
 * provider state: creates a given user
 *
 * @param {object} provider
 * @param {string} username user to create
 * @param {sring} password
 */
const givenUserExists = (provider, username, password) => {
  return provider
    .given('the user is recreated', { username, password })
}

/**
 * provider state: creates a given group
 *
 * @param {object} provider
 * @param {string} group
 */
const givenGroupExists = (provider, group) => {
  return provider
    .given('group exists', { groupName: group })
}

/**
 * provider state: creates given file
 *
 * @param {object} provider
 * @param {string} username
 * @param {sring} password
 * @param {sring} resource file name
 */
const givenFileExists = (provider, username, password, resource) => {
  return provider
    .given('file exists', { username, password, fileName: encodeURIComponent(resource) })
}

/**
 * provider state: creates a given folder
 *
 * @param {object} provider
 * @param {string} username
 * @param {sring} password
 * @param {sring} resource folder name
 */
const givenFolderExists = (provider, username, password, resource) => {
  return provider
    .given('folder exists', { username, password, folderName: resource })
}

/**
 * provider state: creates a share
 *
 * @param {object} provider
 * @param {string} username
 * @param {sring} password
 * @param {sring} resource
 * @param {sring} shareType
 * @param {sring} shareWith
 */
const givenShareExists = async (
  provider,
  username,
  password,
  resource,
  shareType,
  shareWith
) => {
  return provider
    .given('resource is shared', { username, password, resource, shareType, shareWith })
}

/**
 * creates file or folder depending on resource type
 *
 * @param {object} provider
 * @param {string} username
 * @param {sring} password
 * @param {sring} resource
 * @param {sring} resourceType
 */
const givenFileFolderIsCreated = (provider, username, password, resource, resourceType) => {
  if (resourceType === 'folder') {
    return givenFolderExists(provider, username, password, resource)
  } else {
    return givenFileExists(provider, username, password, resource)
  }
}

/**
 * creates user, group or public link share depending on shareType
 *
 * @param {object} provider
 * @param {string} username
 * @param {sring} password
 * @param {sring} resource
 * @param {sring} shareType
 */
const givenResourceIsShared = async (provider, username, password, resource, shareType) => {
  if (shareType === 3) {
    return givenShareExists(provider, username, password, resource, shareType)
  } else if (shareType === 0) {
    await givenUserExists(provider, config.testUser2, config.testUser2Password)
    return givenShareExists(provider, username, password, resource, shareType, config.testUser2)
  } else if (shareType === 1) {
    await givenGroupExists(provider, config.testGroup)
    return givenShareExists(provider, username, password, resource, shareType, config.testGroup)
  }
}

module.exports = {
  givenUserExists,
  givenGroupExists,
  givenFileExists,
  givenFolderExists,
  givenShareExists,
  givenFileFolderIsCreated,
  givenResourceIsShared
}
