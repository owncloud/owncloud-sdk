/* jshint camelcase: false */

/**
 * @class ShareInfo
 * @classdesc ShareInfo class, stores information regarding a share
 * @param {object} ShareInfo containing information like id, url etc. of the share
 */

const USER_TYPE_GUEST = '1'
const SHARE_TYPE_GUEST = '4'

class ShareInfo {
  constructor (shareInfo) {
    this.shareInfo = shareInfo

    /**
     * oC10 does not emit if a share receiver is a user or a guest,
     * therefore we check if the property `share_with_user_type` is present and set to `USER_TYPE_GUEST`,
     * if so we manipulate the `share_type` property and set it to `SHARE_TYPE_GUEST`
     */
    if (this.shareInfo?.share_with_user_type === USER_TYPE_GUEST) {
      this.shareInfo.share_type = SHARE_TYPE_GUEST
    }
  }

  /**
   * Gets the ID of share
   * @returns {number} ID of share
   */
  getId () {
    return this._getInt('id')
  }

  /**
   * Gets share type of share
   * @returns {number} Share type of share
   */
  getShareType () {
    return this._getInt('share_type')
  }

  /**
   * Gets shareWith of the share
   * @returns {string|null} shareWith of share
   */
  getShareWith () {
    if (Object.prototype.hasOwnProperty.call(this.shareInfo, 'share_with')) {
      return this.shareInfo.share_with
    }
    return null
  }

  /**
   * Gets display name of share
   * @returns {string|null} display name of share
   */
  getShareWithDisplayName () {
    if (Object.prototype.hasOwnProperty.call(this.shareInfo, 'share_with_displayname')) {
      return this.shareInfo.share_with_displayname
    }
    return null
  }

  /**
   * Gets path of share
   * @returns {string} Path of share
   */
  getPath () {
    if (Object.prototype.hasOwnProperty.call(this.shareInfo, 'path')) {
      return this.shareInfo.path
    }
    return null
  }

  /**
   * Gets permissions of share
   * @returns {number} permissions of share
   */
  getPermissions () {
    return this._getInt('permissions')
  }

  /**
   * Gets share time of share
   * @returns {number} Share time of share
   */
  getShareTime () {
    this._getInt('stime')
  }

  /**
   * Gets expiration time of share
   * @returns {number} Expiration time of share
   */
  getExpiration () {
    return this._getInt('expiration') || null
  }

  /**
   * Gets token of share
   * @returns {string|null} token of share
   */
  getToken () {
    if (Object.prototype.hasOwnProperty.call(this.shareInfo, 'token')) {
      return this.shareInfo.token
    }
    return null
  }

  /**
   * Gets link of share
   * @returns {string|null} Link of share
   */
  getLink () {
    if (Object.prototype.hasOwnProperty.call(this.shareInfo, 'url')) {
      return this.shareInfo.url
    }
    return null
  }

  /**
   * Gets UID owner of share
   * @returns {string|null} UID owner of share
   */
  getUidOwner () {
    if (Object.prototype.hasOwnProperty.call(this.shareInfo, 'uid_file_owner')) {
      return this.shareInfo.uid_file_owner
    }
    return null
  }

  /**
   * Gets name of owner of share
   * @returns {string|null} name of owner of share
   */
  getDisplaynameOwner () {
    if (Object.prototype.hasOwnProperty.call(this.shareInfo, 'displayname_file_owner')) {
      return this.shareInfo.displayname_file_owner
    }
    return null
  }

  /**
   * Gets name of share
   * @returns {string|null} name of share
   */
  getName () {
    if (Object.prototype.hasOwnProperty.call(this.shareInfo, 'name')) {
      return this.shareInfo.name
    }
    return null
  }

  /**
   * Typecasts to integer
   * @param   {string}    [key]   Corresponding key element to be typecasted to an integer
   * @returns {number}           typecasted integer
   */
  _getInt (key) {
    return parseInt(this.shareInfo[key])
  }
}

module.exports = { ShareInfo, USER_TYPE_GUEST, SHARE_TYPE_GUEST }
