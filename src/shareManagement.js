const Promise = require('promise')
const parser = require('./xmlParser.js')
const ShareInfo = require('./shareInfo.js')

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
 *          <li>shareFileWithGroup</li>
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
   * @param   {object}    optionalParams   {permissions: integer, publicUpload: boolean, password: string, expireDate: string, name: string, attributes: array}
   * @returns {Promise.<shareInfo>}        instance of class shareInfo
   * @returns {Promise.<error>}            string: error message, if any.
   */
  shareFileWithLink (path, optionalParams = {}) {
    path = this.helpers._normalizePath(path)

    const postData = {
      shareType: this.helpers.OCS_SHARE_TYPE_LINK,
      path: path
    }

    if (optionalParams) {
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
   * @param   {object}    optionalParams   {permissions: integer, expirationDate: ISO Date, remoteUser: boolean, attributes: array}
   * @returns {Promise.<ShareInfo>}        instance of class ShareInfo
   * @returns {Promise.<error>}            string: error message, if any.
   */
  shareFileWithUser (path, username, optionalParams) {
    path = this.helpers._normalizePath(path)

    const postData = {
      shareType: this.helpers.OCS_SHARE_TYPE_USER,
      shareWith: username,
      path: path
    }

    if (optionalParams) {
      if (optionalParams.permissions) {
        postData.permissions = optionalParams.permissions
      }

      if (optionalParams.expirationDate) {
        postData.expireDate = optionalParams.expirationDate
      }

      if (optionalParams.attributes) {
        postData.attributes = optionalParams.attributes
      }

      if (optionalParams.remoteUser) {
        postData.shareType = this.helpers.OCS_SHARE_TYPE_REMOTE
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
   * @param   {object}    optionalParams   {permissions: integer, expirationDate: ISO Date, attributes: array}
   * @returns {Promise.<ShareInfo>}        instance of class ShareInfo
   * @returns {Promise.<error>}            string: error message, if any.
   */
  shareFileWithGroup (path, groupName, optionalParams) {
    path = this.helpers._normalizePath(path)

    const postData = {
      shareType: this.helpers.OCS_SHARE_TYPE_GROUP,
      shareWith: groupName,
      path: path
    }

    if (optionalParams) {
      if (optionalParams.permissions) {
        postData.permissions = optionalParams.permissions
      }

      if (optionalParams.expirationDate) {
        postData.expireDate = optionalParams.expirationDate
      }

      if (optionalParams.attributes) {
        postData.attributes = optionalParams.attributes
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
      data += '?'

      send.path = this.helpers._normalizePath(path)
      optionalParams = this.helpers._convertObjectToBool(optionalParams)

      if (optionalParams) {
        if (optionalParams.reshares && typeof (optionalParams.reshares) === 'boolean') {
          send.reshares = optionalParams.reshares
        }

        if (optionalParams.subfiles && typeof (optionalParams.subfiles) === 'boolean') {
          send.subfiles = optionalParams.subfiles
        }

        /* jshint camelcase: false */
        if (optionalParams.shared_with_me && typeof (optionalParams.shared_with_me) === 'boolean') {
          send.shared_with_me = optionalParams.shared_with_me
          if (optionalParams.state) {
            send.state = optionalParams.state
          }
        }
        /* jshint camelcase: true */
      }

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
      if (isNaN((parseInt(shareId)))) {
        reject('Please pass a valid share ID (Integer)')
        return
      }
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
      if (isNaN((parseInt(shareId)))) {
        reject('Please pass a valid share ID (Integer)', null)
        return
      }

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
      if (isNaN((parseInt(shareId)))) {
        reject('Please pass a valid share ID (Integer)', null)
        return
      }

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
   * @param  {object}  optionalParams  {permissions: integer, publicUpload: boolean, password: string, expireDate: string, name: string, attributes: array}
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
      if (optionalParams.permissions) {
        postData.permissions = optionalParams.permissions
      }
      if (optionalParams.attributes) {
        postData.attributes = optionalParams.attributes
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
   * @returns {Promise.<status>}    boolean: true if successful
   * @returns {Promise.<error>}     string: error message, if any.
   */
  deleteShare (shareId) {
    return new Promise((resolve, reject) => {
      if (isNaN((parseInt(shareId)))) {
        reject('Please pass a valid share ID (Integer)', null)
        return
      }

      /* jshint unused: false */
      this.helpers._makeOCSrequest('DELETE', this.helpers.OCS_SERVICE_SHARE,
        'shares/' + encodeURIComponent(shareId.toString())
      ).then(() => {
        resolve(true)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Deletes a share
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
        return json.ocs.data
      })
  }
}

module.exports = Shares
