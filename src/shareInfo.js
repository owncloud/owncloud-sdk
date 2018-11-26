/* jshint camelcase: false */

/**
 * @class ShareInfo
 * @classdesc ShareInfo class, stores information regarding a share
 * @param {object} ShareInfo containing information like id, url etc. of the share
 */
function ShareInfo (shareInfo) {
  this.shareInfo = {}

  // Below keys don't need to be stored
  var notNeededKeys = ['item_type', 'item_source', 'file_source', 'parent', 'storage', 'mail_send']

  for (var key in shareInfo) {
    if (!(key in notNeededKeys)) {
      this.shareInfo[key] = shareInfo[key]
    }
  }
}

/**
 * Gets the ID of share
 * @returns {number} ID of share
 */
ShareInfo.prototype.getId = function () {
  return this._getInt('id')
}

/**
 * Gets share type of share
 * @returns {number} Share type of share
 */
ShareInfo.prototype.getShareType = function () {
  return this._getInt('share_type')
}

/**
 * Gets shareWith of the share
 * @returns {string} shareWith of share
 */
ShareInfo.prototype.getShareWith = function () {
  if (this.shareInfo.hasOwnProperty('share_with')) {
    return this.shareInfo.share_with
  }
  return null
}

/**
 * Gets display name of share
 * @returns {string} display name of share
 */
ShareInfo.prototype.getShareWithDisplayName = function () {
  if (this.shareInfo.hasOwnProperty('share_with_displayname')) {
    return this.shareInfo.share_with_displayname
  }
  return null
}

/**
 * Gets path of share
 * @returns {string} Path of share
 */
ShareInfo.prototype.getPath = function () {
  if (this.shareInfo.hasOwnProperty('path')) {
    return this.shareInfo.path
  }
  return null
}

/**
 * Gets permissions of share
 * @returns {string} permissions of share
 */
ShareInfo.prototype.getPermissions = function () {
  return this._getInt('permissions')
}

/**
 * Gets share time of share
 * @returns {number} Share time of share
 */
ShareInfo.prototype.getShareTime = function () {
  this._getInt('stime')
}

/**
 * Gets expiration time of share
 * @returns {number} Expiration time of share
 */
ShareInfo.prototype.getExpiration = function () {
  return this._getInt('expiration') || null
}

/**
 * Gets token of share
 * @returns {string} token of share
 */
ShareInfo.prototype.getToken = function () {
  if (this.shareInfo.hasOwnProperty('token')) {
    return this.shareInfo.token
  }
  return null
}

/**
 * Gets link of share
 * @returns {string} Link of share
 */
ShareInfo.prototype.getLink = function () {
  if (this.shareInfo.hasOwnProperty('url')) {
    return this.shareInfo.url
  }
  return null
}

/**
 * Gets UID owner of share
 * @returns {string} UID owner of share
 */
ShareInfo.prototype.getUidOwner = function () {
  if (this.shareInfo.hasOwnProperty('uid_file_owner')) {
    return this.shareInfo.uid_file_owner
  }
  return null
}

/**
 * Gets name of owner of share
 * @returns {string} name of owner of share
 */
ShareInfo.prototype.getDisplaynameOwner = function () {
  if (this.shareInfo.hasOwnProperty('displayname_file_owner')) {
    return this.shareInfo.displayname_file_owner
  }
  return null
}

/**
 * Typecasts to integer
 * @param   {string}    [key]   Corresponding key element to be typecasted to an integer
 * @returns {number}           typcasted integer
 */
ShareInfo.prototype._getInt = function (key) {
  return parseInt(this.shareInfo[key])
}

module.exports = ShareInfo
