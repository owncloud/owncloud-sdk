const config = require('../config/config.json')

const SHARE_TYPE = Object.freeze({
  user: 0,
  group: 1,
  public: 3
})

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
 * provider state: creates a user share
 *
 * @param {object} provider
 * @param {string} username
 * @param {sring} userPassword
 * @param {sring} path
 * @param {string} shareWith
 * @param {object} optionalParams
 */
const givenUserShareExists = (
  provider,
  username,
  userPassword,
  path,
  shareWith,
  optionalParams
) => {
  return provider
    .given('resource is shared', {
      username,
      userPassword,
      path,
      shareType: SHARE_TYPE.user,
      shareWith,
      ...optionalParams
    })
}

/**
 * provider state: creates a group share
 *
 * @param {object} provider
 * @param {string} username
 * @param {sring} userPassword
 * @param {sring} path
 * @param {string} shareWith
 * @param {object} optionalParams
 */
const givenGroupShareExists = (
  provider,
  username,
  userPassword,
  path,
  shareWith,
  optionalParams
) => {
  return provider
    .given('resource is shared', {
      username,
      userPassword,
      path,
      shareType: SHARE_TYPE.group,
      shareWith,
      ...optionalParams
    })
}

/**
 * provider state: creates a public link share
 *
 * @param {object} provider
 * @param {string} username
 * @param {sring} userPassword
 * @param {sring} path
 * @param {object} optionalParams
 */
const givenPublicShareExists = (
  provider,
  username,
  userPassword,
  path,
  optionalParams
) => {
  return provider
    .given('resource is shared', {
      username,
      userPassword,
      path,
      shareType: SHARE_TYPE.public,
      ...optionalParams
    })
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
 * @param {sring} userPassword
 * @param {sring} resource
 * @param {number} shareType
 * @param {sring} shareWith
 * @param {number} permissions
 * @param {string} expireDate
 * @param {object} attributes
 * @param {string} password
 * @param {boolean} publicUpload
 */
const givenResourceIsShared = async (
  provider,
  username,
  userPassword,
  resource,
  shareType,
  shareWith,
  permissions,
  expireDate,
  attributes,
  password,
  publicUpload
) => {
  if (shareType === SHARE_TYPE.public) {
    return givenPublicShareExists(
      provider,
      username,
      userPassword,
      resource,
      {
        permissions,
        password,
        publicUpload,
        expireDate,
        attributes
      }
    )
  } else if (shareType === SHARE_TYPE.user) {
    await givenUserExists(provider, shareWith, config.testUser2Password)
    return givenUserShareExists(
      provider,
      username,
      userPassword,
      resource,
      shareWith,
      {
        permissions,
        expireDate,
        attributes
      }
    )
  } else if (shareType === SHARE_TYPE.group) {
    await givenGroupExists(provider, shareWith)
    return givenGroupShareExists(
      provider,
      username,
      userPassword,
      resource,
      shareWith,
      {
        permissions,
        expireDate,
        attributes
      }
    )
  }
}

module.exports = {
  givenUserExists,
  givenGroupExists,
  givenFileExists,
  givenFolderExists,
  givenUserShareExists,
  givenGroupShareExists,
  givenPublicShareExists,
  givenFileFolderIsCreated,
  givenResourceIsShared
}
