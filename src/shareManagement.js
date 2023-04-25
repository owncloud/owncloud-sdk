const Promise = require('promise')
const parser = require('./xmlParser.js')
const { ShareInfo, USER_TYPE_GUEST, SHARE_TYPE_GUEST } = require('./shareInfo.js')

/**
 * @class Shares
 * @classdesc
 * <b><i> The Shares class, has all the methods for share management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>Share Management</b>
 *      <ul>
 *          <li>shareFileWithLink</li>
 *          <li>updateShare</li>
 *          <li>shareFileWithUser</li>
 *          <li>shareSpaceWithUser</li>
 *          <li>shareFileWithGroup</li>
 *          <li>shareSpaceWithGroup</li>
 *          <li>getShares</li>
 *          <li>isShared</li>
 *          <li>getShare</li>
 *          <li>listOpenRemoteShare</li>
 *          <li>acceptRemoteShare</li>
 *          <li>declineRemoteShare</li>
 *          <li>deleteShare</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param   {object}  helperFile  instance of the helpers class
 */
class Shares {
  constructor (helperFile) {
    this.helpers = helperFile
  }

  /**
   * Shares a remote file with link
   * @param   {string}    path             path to the remote file share
   * @param   {object}    optionalParams   {permissions: integer, publicUpload: boolean, password: string, expireDate: string, name: string, attributes: assoc array (at free disposal)}
   * @returns {Promise.<shareInfo>}        instance of class shareInfo
   * @returns {Promise.<error>}            string: error message, if any.
   */
  shareFileWithLink (path, optionalParams = {}) {
    path = this.helpers._normalizePath(path)

    const postData = {
      shareType: this.helpers.OCS_SHARE_TYPE_LINK,
      path: path
    }

    const reflectClassicAttribute = (key, scope, value, exclusive = true) => {
      const attributes = [...postData.attributes || []]
      const current = attributes.findIndex(v => v.scope === scope && v.key === key)

      if (current !== -1 && exclusive) {
        attributes.splice(current, 1)
      }

      attributes.push({ key, scope, value })
      postData.attributes = attributes
    }

    if (optionalParams) {
      if (optionalParams.spaceRef) {
        postData.space_ref = optionalParams.spaceRef
      }
      if (optionalParams.permissions) {
        postData.permissions = optionalParams.permissions
      }
      if (optionalParams.password) {
        postData.password = optionalParams.password
      }
      if (optionalParams.expireDate) {
        postData.expireDate = optionalParams.expireDate
      }
      if (optionalParams.name) {
        postData.name = optionalParams.name
      }
      if (optionalParams.publicUpload && typeof (optionalParams.publicUpload) === 'boolean') {
        postData.publicUpload = optionalParams.publicUpload.toString().toLowerCase()
      }
      if (optionalParams.attributes) {
        postData.attributes = optionalParams.attributes
      }
      if (optionalParams.quicklink) {
        postData.quicklink = optionalParams.quicklink
        reflectClassicAttribute('isQuickLink', 'files_sharing', postData.quicklink)
      }
    }

    return this.helpers._makeOCSrequest('POST', this.helpers.OCS_SERVICE_SHARE, 'shares', postData)
      .then(data => {
        const shareDetails = parser.xml2js(data.body).ocs.data
        const share = new ShareInfo(shareDetails)

        return Promise.resolve(share)
      })
  }

  /**
   * Shares a remote file with specified user
   * @param   {string}    path             path to the remote file share
   * @param   {string}    username         name of the user to share with
   * @param   {object}    optionalParams   {permissions: integer, expirationDate: ISO Date, remoteUser: boolean, attributes: assoc array (at free disposal), shareWithUser: string, shareWithProvider: string}
   * @returns {Promise.<ShareInfo>}        instance of class ShareInfo
   * @returns {Promise.<error>}            string: error message, if any.
   */
  shareFileWithUser (path, username, optionalParams) {
    path = this.helpers._normalizePath(path)

    let postData = {
      shareType: this.helpers.OCS_SHARE_TYPE_USER,
      shareWith: username,
      path: path
    }

    if (optionalParams) {
      if (optionalParams.spaceRef) {
        postData.space_ref = optionalParams.spaceRef
      }

      postData = { ...postData, ...this._getOptionalParams(optionalParams) }
    }

    return this.helpers._makeOCSrequest('POST', this.helpers.OCS_SERVICE_SHARE, 'shares', postData)
      .then(data => {
        const shareData = data.data.ocs.data
        const share = new ShareInfo(shareData)

        return Promise.resolve(share)
      })
  }

  /**
   * Shares a space with specified user
   * @param   {string}    path             path to the remote file share
   * @param   {string}    username         name of the user to share with
   * @param   {string}    spaceId          id of the space
   * @param   {object}    optionalParams   {permissions: integer, expirationDate: ISO Date, remoteUser: boolean, attributes: assoc array (at free disposal)}
   * @returns {Promise.<ShareInfo>}        instance of class ShareInfo
   * @returns {Promise.<error>}            string: error message, if any.
   */
  shareSpaceWithUser (path, username, spaceId, optionalParams) {
    return this.shareSpace(path, username, this.helpers.OCS_SHARE_TYPE_SPACE_USER, spaceId, optionalParams)
  }

  /**
   * Shares a space with specified user
   * @param   {string}    path             path to the remote file share
   * @param   {string}    groupName        name of the group to share with
   * @param   {string}    spaceId          id of the space
   * @param   {object}    optionalParams   {permissions: integer, expirationDate: ISO Date, attributes: assoc array (at free disposal)}
   * @returns {Promise.<ShareInfo>}        instance of class ShareInfo
   * @returns {Promise.<error>}            string: error message, if any.
   */
  shareSpaceWithGroup (path, groupName, spaceId, optionalParams) {
    return this.shareSpace(path, groupName, this.helpers.OCS_SHARE_TYPE_SPACE_GROUP, spaceId, optionalParams)
  }

  /**
   * Shares a space with specified user or group
   * @param   {string}    path             path to the remote file share
   * @param   {string}    shareWith        name of the user or group to share with
   * @param   {number}    shareType        share type for the new share
   * @param   {string}    spaceId          id of the space
   * @param   {object}    optionalParams   {permissions: integer, expirationDate: ISO Date, remoteUser: boolean, attributes: assoc array (at free disposal)}
   * @returns {Promise.<ShareInfo>}        instance of class ShareInfo
   * @returns {Promise.<error>}            string: error message, if any.
   */
  shareSpace (path, shareWith, shareType, spaceId, optionalParams) {
    let postData = {
      shareType,
      shareWith,
      space_ref: spaceId
    }

    if (path) {
      postData.path = this.helpers._normalizePath(path)
    }

    if (optionalParams) {
      postData = { ...postData, ...this._getOptionalParams(optionalParams) }

      if (optionalParams.expireDate !== undefined) {
        postData.expireDate = optionalParams.expireDate
      }
    }

    return this.helpers._makeOCSrequest('POST', this.helpers.OCS_SERVICE_SHARE, 'shares', postData)
      .then(data => {
        const shareData = data.data.ocs.data
        const share = new ShareInfo(shareData)

        return Promise.resolve(share)
      })
  }

  /**
   * Shares a remote file with specified group
   * @param   {string}    path             path to the remote file share
   * @param   {string}    groupName        name of group to share with
   * @param   {object}    optionalParams   {permissions: integer, expirationDate: ISO Date, attributes: assoc array (at free disposal)}
   * @returns {Promise.<ShareInfo>}        instance of class ShareInfo
   * @returns {Promise.<error>}            string: error message, if any.
   */
  shareFileWithGroup (path, groupName, optionalParams) {
    path = this.helpers._normalizePath(path)

    let postData = {
      shareType: this.helpers.OCS_SHARE_TYPE_GROUP,
      shareWith: groupName,
      path: path
    }

    if (optionalParams) {
      if (optionalParams.spaceRef) {
        postData.space_ref = optionalParams.spaceRef
      }

      postData = { ...postData, ...this._getOptionalParams(optionalParams) }
    }

    return this.helpers._makeOCSrequest('POST', this.helpers.OCS_SERVICE_SHARE, 'shares', postData)
      .then(data => {
        const shareData = data.data.ocs.data
        const share = new ShareInfo(shareData)

        return Promise.resolve(share)
      })
  }

  /**
   * Returns array of shares
   * @param   {string}  path            path to the file whose share needs to be checked
   * @param   {object}  optionalParams  object of values {"reshares": boolean,
   *                                    "subfiles": boolean, "shared_with_me": boolean, "state": number}
   * @returns {Promise.<ShareInfo>}     Array of instances of class ShareInfo for all Shares
   * @returns {Promise.<error>}         string: error message, if any.
   */
  getShares (path, optionalParams) {
    let data = 'shares'
    const send = {}

    if (path !== '') {
      send.path = this.helpers._normalizePath(path)
    }

    optionalParams = this.helpers._convertObjectToBool(optionalParams)

    if (optionalParams) {
      if (optionalParams.spaceRef) {
        send.space_ref = optionalParams.spaceRef
      }

      if (optionalParams.reshares && typeof (optionalParams.reshares) === 'boolean') {
        send.reshares = optionalParams.reshares
      }

      if (optionalParams.subfiles && typeof (optionalParams.subfiles) === 'boolean') {
        send.subfiles = optionalParams.subfiles
      }

      if ('include_tags' in optionalParams && typeof (optionalParams.include_tags) === 'boolean') {
        send.include_tags = optionalParams.include_tags
      }

      if (optionalParams.share_types && typeof (optionalParams.share_types) === 'string') {
        send.share_types = optionalParams.share_types
      }

      if (optionalParams.state && typeof (optionalParams.state) === 'string') {
        send.state = optionalParams.state
      }

      /* jshint camelcase: false */
      if ('shared_with_me' in optionalParams && typeof (optionalParams.shared_with_me) === 'boolean') {
        send.shared_with_me = optionalParams.shared_with_me
        if (optionalParams.state) {
          send.state = optionalParams.state
        }
      }
      /* jshint camelcase: true */
    }

    if (Object.keys(send).length) {
      data += '?'
      let urlString = ''
      for (const key in send) {
        urlString += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(send[key])
      }
      urlString = urlString.slice(1) // removing the first '&'

      data += urlString
    }

    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_SHARE, data)
        .then(data => {
          let elements = data.data.ocs.data.element || []
          const shares = []

          if (elements && elements.constructor !== Array) {
            // just a single element
            elements = [elements]
          }
          for (let i = 0; i < elements.length; i++) {
            const share = new ShareInfo(elements[i])
            shares.push(share)
          }
          resolve(shares)
        }).catch(error => {
          reject(error)
        })
    })
  }

  /**
   * Checks whether a path is already shared
   * @param   {string}    path    path to the share to be checked
   * @returns {Promise.<status>}  boolean: true if shared
   * @returns {Promise.<error>}   string: error message, if any.
   */
  isShared (path) {
    const self = this

    return new Promise((resolve, reject) => {
      self.getShares(path)
        .then(shares => {
          resolve(shares.length > 0)
        }).catch(error => {
          reject(error)
        })
    })
  }

  /**
   * Gets share information about known share
   * @param   {number}   shareId     ID of the share to be checked
   * @returns {Promise.<ShareInfo>}   instance of class ShareInfo
   * @returns {Promise.<error>}       string: error message, if any.
   */
  getShare (shareId) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_SHARE, 'shares/' + shareId.toString())
        .then(data => {
          const shareData = data.data.ocs.data.element
          const share = new ShareInfo(shareData)

          resolve(share)
        }).catch(error => {
          reject(error)
        })
    })
  }

  /**
   * List all pending remote share
   * @returns {Promise.<shares>}  all open remote shares
   * @returns {Promise.<error>}     string: error message, if any.
   */
  listOpenRemoteShare () {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_SHARE, 'remote_shares/pending')
        .then(data => {
          const shares = data.data.ocs.data.element || []

          resolve(shares)
        }).catch(error => {
          reject(error)
        })
    })
  }

  /**
   * Accepts a remote share
   * @param   {number}   shareId   ID of the share to accept
   * @returns {Promise.<status>}    boolean: true if successful
   * @returns {Promise.<error>}     string: error message, if any.
   */
  acceptRemoteShare (shareId) {
    return new Promise((resolve, reject) => {
      /* jshint unused: false */
      this.helpers._makeOCSrequest('POST', this.helpers.OCS_SERVICE_SHARE,
        'remote_shares/pending' + encodeURIComponent(shareId.toString())
      ).then(() => {
        resolve(true)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Declines a remote share
   * @param   {number}   shareId   ID of the share to decline
   * @returns {Promise.<status>}    boolean: true if successful
   * @returns {Promise.<error>}     string: error message, if any.
   */
  declineRemoteShare (shareId) {
    return new Promise((resolve, reject) => {
      /* jshint unused: false */
      this.helpers._makeOCSrequest('DELETE', this.helpers.OCS_SERVICE_SHARE,
        'remote_shares/pending' + encodeURIComponent(shareId.toString())
      ).then(() => {
        resolve(true)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Updates a given share
   * @param  {number}  shareId         ID of the share to update
   * @param  {object}  optionalParams  {permissions: integer, publicUpload: boolean, password: string, expireDate: string, name: string, attributes: assoc array (at free disposal)}
   * @return {Promise.<status>}        boolean: true if successful
   * @return {Promise.<error>}         string: error message, if any.
   */
  updateShare (shareId, optionalParams) {
    const postData = {}

    if (optionalParams) {
      if (optionalParams.permissions) {
        postData.permissions = optionalParams.permissions
      }
      if (optionalParams.name !== undefined) {
        postData.name = optionalParams.name
      }
      if (optionalParams.password !== undefined) {
        postData.password = optionalParams.password
      }
      if (optionalParams.expireDate !== undefined) {
        postData.expireDate = optionalParams.expireDate
      }
      if (optionalParams.publicUpload && typeof (optionalParams.publicUpload) === 'boolean') {
        postData.publicUpload = optionalParams.publicUpload.toString().toLowerCase()
      }
      if (optionalParams.role) {
        postData.role = optionalParams.role
      }
      if (optionalParams.attributes) {
        postData.attributes = optionalParams.attributes
      }
      if (optionalParams.notifyUploads !== undefined) {
        postData.notifyUploads = optionalParams.notifyUploads
      }
      if (optionalParams.notifyUploadsExtraRecipients !== undefined) {
        postData.notifyUploadsExtraRecipients = optionalParams.notifyUploadsExtraRecipients
      }
      if (optionalParams.notifyAddresses !== undefined) {
        postData.notifyAddresses = optionalParams.notifyAddresses
      }
    }

    /* jshint unused: false */
    return this.helpers._makeOCSrequest('PUT', this.helpers.OCS_SERVICE_SHARE,
      'shares/' + shareId.toString(), postData, 1
    ).then(data => {
      return Promise.resolve(new ShareInfo(data.data.ocs.data))
    })
  }

  /**
   * Deletes a share
   * @param   {number}   shareId   ID of the share to delete
   * @param   {object}   urlParams   {shareWith: string}
   * @returns {Promise.<status>}    boolean: true if successful
   * @returns {Promise.<error>}     string: error message, if any.
   */
  deleteShare (shareId, urlParams) {
    let urlParamString = ''
    if (urlParams) {
      urlParamString = '?'
      if (urlParams.shareWith) {
        urlParamString += `shareWith=${urlParams.shareWith}`
      }
    }

    return new Promise((resolve, reject) => {
      /* jshint unused: false */
      this.helpers._makeOCSrequest('DELETE', this.helpers.OCS_SERVICE_SHARE,
        'shares/' + encodeURIComponent(shareId.toString()) + urlParamString
      ).then(() => {
        resolve(true)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Send a share reminder notification
   * @param   {number}   shareId   ID of the share to delete
   * @returns {Promise.<status>}   string: Array of emails where notification was sent.
   * @returns {Promise.<error>}    string: error message, if any.
   */
  notifyShare (shareId) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_SHARE,
        'shares/' + encodeURIComponent(shareId.toString()) + '/notify', []
      ).then(data => {
        if (data.response.ok) {
          resolve(data.data.recipients)
        }
        throw new Error(data.response.status + '/' + data.response.statusText)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Get share Recipients
   * @param {string} search
   * @param {string} itemType
   * @param {number} page
   * @param {number} perPage
   * @returns {Promise.<status>}    boolean: true if successful
   * @returns {Promise.<error>}     string: error message, if any.
   */
  getRecipients (search, itemType, page = 1, perPage = 200) {
    if (isNaN(parseInt(page)) || page < 1) {
      return Promise.reject(new Error('Please pass a valid page parameter (Integer)'))
    }
    if (isNaN(parseInt(perPage)) || perPage < 1) {
      return Promise.reject(new Error('Please pass a valid perPage parameter (Integer)'))
    }

    return this.helpers.ocs({
      method: 'GET',
      service: 'apps/files_sharing',
      action: 'api/v1/sharees?search=' + encodeURIComponent(search) + '&itemType=' + encodeURIComponent(itemType) +
        '&page=' + page + '&perPage=' + perPage
    })
      .then(response => {
        if (response.ok) {
          return response.json()
        }
        throw new Error(response.status + '/' + response.statusText)
      })
      .then(json => {
        const data = json.ocs.data

        /**
         * oC10 does not use the share type `guest` but `user` for guest shares.
         * As mitigation it emits `userType` with value `0` for user and `1` for guest shares.
         * We utilize this information to rewrite the `shareType` to guest when needed.
         */
        data.users.forEach((user) => {
          if (user.value.userType === parseInt(USER_TYPE_GUEST)) {
            user.value.shareType = parseInt(SHARE_TYPE_GUEST)
          }
        })

        return data
      })
  }

  /**
   * Gets the protected token info for a public link
   * @param   {string}   token     token of the public link
   * @returns {Promise.<ShareInfo>}   instance of class ShareInfo
   * @returns {Promise.<error>}       string: error message, if any.
   */
  getProtectedTokenInfo (token) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_SHARE, this.helpers.OCS_PROTECTED_TOKEN_INFO + '/' + token)
        .then(data => {
          const tokenInfo = data.data.ocs.data
          resolve(tokenInfo)
        }).catch(error => {
          reject(error)
        })
    })
  }

  /**
   * Gets the unprotected token info for a public link
   * @param   {string}   token     token of the public link
   * @returns {Promise.<ShareInfo>}   instance of class ShareInfo
   * @returns {Promise.<error>}       string: error message, if any.
   */
  getUnprotectedTokenInfo (token) {
    return new Promise((resolve, reject) => {
      this.helpers._makeOCSrequest('GET', this.helpers.OCS_SERVICE_SHARE, this.helpers.OCS_UNPROTECTED_TOKEN_INFO + '/' + token, null, false)
        .then(data => {
          const tokenInfo = data.data.ocs.data
          resolve(tokenInfo)
        }).catch(error => {
          reject(error)
        })
    })
  }

  /**
   * @param {object} optionalParams
   * @returns {object}
   */
  _getOptionalParams (optionalParams) {
    const data = {}

    if (optionalParams.shareWithUser) {
      data.shareWithUser = optionalParams.shareWithUser
    }

    if (optionalParams.shareWithProvider) {
      data.shareWithProvider = optionalParams.shareWithProvider
    }

    if (optionalParams.permissions) {
      data.permissions = optionalParams.permissions
    }

    if (optionalParams.role) {
      data.role = optionalParams.role
    }

    if (optionalParams.expirationDate) {
      data.expireDate = optionalParams.expirationDate
    }

    if (optionalParams.attributes) {
      data.attributes = optionalParams.attributes
    }

    if (optionalParams.remoteUser) {
      data.shareType = this.helpers.OCS_SHARE_TYPE_REMOTE
    }

    if (optionalParams.notify) {
      data.notify = optionalParams.notify
    }

    return data
  }
}

module.exports = Shares
