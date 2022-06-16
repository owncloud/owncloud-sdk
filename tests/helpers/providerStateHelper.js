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
 */
const givenUserExists = (provider, username) => {
  return provider
    .given('the user is recreated', { username })
}

/**
 * provider state: deletes a given user
 *
 * @param {object} provider
 * @param {string} username
 */
const givenUserDoesNotExist = (provider, username) => {
  return provider.given('user doesn\'t exist', { username })
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
 * provider state: deletes a given group
 *
 * @param {object} provider
 * @param {string} group
 */
const givenGroupDoesNotExist = (provider, group) => {
  return provider.given('group does not exist', { groupName: group })
}

/**
 * provider state: creates given file
 *
 * @param {object} provider
 * @param {string} username
 * @param {string} resource file name
 * @param {string} content
 */
const givenFileExists = (provider, username, resource, content) => {
  return provider
    .given('file exists', { username, fileName: resource, content })
}

/**
 * provider state: creates a given folder
 *
 * @param {object} provider
 * @param {string} username
 * @param {string} resource folder name
 */
const givenFolderExists = (provider, username, resource) => {
  return provider
    .given('folder exists', { username, folderName: resource })
}

/**
 * provider state: delete a given resource
 *
 * @param {object} provider
 * @param {string} username
 * @param {string} resource
 */
const givenResourceIsDeleted = (provider, username, resource) => {
  return provider.given('resource is deleted', { username, resourcePath: resource })
}

/**
 * provider state: creates a user share
 *
 * @param {object} provider
 * @param {string} username
 * @param {string} path
 * @param {string} shareWith
 * @param {object} optionalParams
 * available optional parameters
 * - permissions
 * - expireDate
 * - attributes
 */
const givenUserShareExists = (
  provider,
  username,
  path,
  shareWith,
  optionalParams
) => {
  return provider
    .given('resource is shared', {
      username,
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
 * @param {string} path
 * @param {string} shareWith
 * @param {object} optionalParams
 * available optional parameters
 * - permissions
 * - expireDate
 * - attributes
 */
const givenGroupShareExists = (
  provider,
  username,
  path,
  shareWith,
  optionalParams
) => {
  return provider
    .given('resource is shared', {
      username,
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
 * @param {string} path
 * @param {object} optionalParams
 * available optional parameters
 * - name
 * - password
 * - permissions
 * - publicUpload
 * - expireDate
 * - attributes
 */
const givenPublicShareExists = (
  provider,
  username,
  path,
  optionalParams
) => {
  return provider
    .given('resource is shared', {
      username,
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
 * @param {string} password
 * @param {string} resource
 * @param {string} resourceType
 */
const givenFileFolderIsCreated = (provider, username, password, resource, resourceType) => {
  if (resourceType === 'folder') {
    return givenFolderExists(provider, username, resource)
  } else {
    return givenFileExists(provider, username, resource)
  }
}

/**
 * creates user, group or public link share depending on shareType
 *
 * @param {object} provider
 * @param {string} username
 * @param {string} resource
 * @param {number} shareType
 * @param {string} shareWith
 * @param {number} permissions
 * @param {string} expireDate
 * @param {object} attributes
 * @param {string} password
 * @param {boolean} publicUpload
 */
const givenResourceIsShared = async (
  provider,
  username,
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
    await givenUserExists(provider, shareWith)
    return givenUserShareExists(
      provider,
      username,
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
      resource,
      shareWith,
      {
        permissions,
        expireDate,
        attributes
      }
    )
  } else {
    throw new Error(`Invalid shareType "${shareType}`)
  }
}

/**
 * marks file as favorite
 *
 * @param {object} provider
 * @param {string} username
 * @param {string} password
 * @param {string} path
 */
const givenFileIsMarkedFavorite = (provider, username, password, path) => {
  return provider
    .given('file is marked as favorite', { username, password, path })
}

/**
 * creates a system tag
 *
 * @param {object} provider
 * @param {string} username
 * @param {string} password
 * @param {string} tag tag name
 */
const givenSystemTagExists = (provider, username, password, tag) => {
  return provider
    .given('a system tag is created', { username, password, tag })
}

/**
 * assigns a tag to a file
 *
 * @param {object} provider
 * @param {string} username
 * @param {string} password
 * @param {string} fileName
 * @param {string} tagName
 */
const givenTagIsAssignedToFile = (provider, username, password, fileName, tagName) => {
  return provider
    .given('a tag is assigned to a file', { username, password, fileName, tagName })
}

/**
 *
 * @param {object} provider
 */
const givenProviderBaseUrlIsReturned = (provider) => {
  return provider.given('provider base url is returned')
}

/**
 * @param {object} provider
 * @param {string} username
 * @param {string} fileName
 * @param {string} number
 */
const givenFileVersionLinkIsReturned = (provider, username, fileName, number) => {
  return provider.given('file version link is returned', {
    username,
    fileName,
    number
  })
}

/**
 * @param {object} provider
 * @param {string} username
 * @param {string} groupName
 */
const givenUserIsMadeGroupSubadmin = (provider, username, groupName) => {
  return provider.given('user is made group subadmin', {
    username,
    groupName
  })
}

/**
 * @param {object} provider
 * @param {string} username
 * @param {string} groupName
 */
const givenUserIsAddedToGroup = (provider, username, groupName) => {
  return provider.given('user is added to group', {
    username,
    groupName
  })
}

/**
 * @param {object} provider
 * @param {string} folderName
 * @param {string} password
 */
const givenFolderExistsInLastPublicShare = (provider, folderName, password) => {
  return provider.given('folder exists in last shared public share', {
    folderName,
    password
  })
}

/**
 * @param {object} provider
 * @param {string} fileName
 * @param {string} password
 * @param {string} content
 */
const givenFileExistsInLastPublicShare = (
  provider,
  fileName,
  password,
  content
) => {
  return provider.given('file exists in last shared public share', {
    fileName,
    password,
    content
  })
}

module.exports = {
  givenUserExists,
  givenUserDoesNotExist,
  givenGroupExists,
  givenGroupDoesNotExist,
  givenFileExists,
  givenFolderExists,
  givenResourceIsDeleted,
  givenUserShareExists,
  givenGroupShareExists,
  givenPublicShareExists,
  givenFileFolderIsCreated,
  givenResourceIsShared,
  givenFileIsMarkedFavorite,
  givenSystemTagExists,
  givenTagIsAssignedToFile,
  givenProviderBaseUrlIsReturned,
  givenFileVersionLinkIsReturned,
  givenUserIsMadeGroupSubadmin,
  givenUserIsAddedToGroup,
  givenFolderExistsInLastPublicShare,
  givenFileExistsInLastPublicShare
}
