var Promise = require('promise')
var parser = require('./xmlParser.js')
var utf8 = require('utf8')
var ShareInfo = require('./shareInfo.js')
var helpers

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
function Shares (helperFile) {
  helpers = helperFile
}

/**
 * Shares a remote file with link
 * @param   {string}    path             path to the remote file share
 * @param   {object}    optionalParams   {perms: integer, publicUpload: boolean, password: string}
 * @returns {Promise.<shareInfo>}        instance of class shareInfo
 * @returns {Promise.<error>}            string: error message, if any.
 */
Shares.prototype.shareFileWithLink = function (path, optionalParams) {
  path = helpers._normalizePath(path)
  // path = helpers._encodeString(path);

  var postData = {
    'shareType': helpers.OCS_SHARE_TYPE_LINK,
    'path': path
  }

  if (optionalParams) {
    if (optionalParams.perms) {
      postData.permissions = optionalParams.perms
    }
    if (optionalParams.password) {
      postData.password = optionalParams.password
    }
    if (optionalParams.publicUpload && typeof (optionalParams.publicUpload) === 'boolean') {
      postData.publicUpload = optionalParams.publicUpload.toString().toLowerCase()
    }
  }

  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 'shares', postData)
      .then(data => {
        data.body = utf8.encode(data.body)
        var shareDetails = parser.xml2js(data.body).ocs.data
        var share = new ShareInfo(shareDetails)

        resolve(share)
      }).catch(error => {
        reject(error)
      })
  })
}

/**
 * Shares a remote file with specified user
 * @param   {string}    path             path to the remote file share
 * @param   {object}    optionalParams   {perms: integer, remoteUser: boolean}
 * @returns {Promise.<ShareInfo>}        instance of class ShareInfo
 * @returns {Promise.<error>}            string: error message, if any.
 */
Shares.prototype.shareFileWithUser = function (path, username, optionalParams) {
  path = helpers._normalizePath(path)
  // path = helpers._encodeString(path);

  var postData = {
    'shareType': helpers.OCS_SHARE_TYPE_USER,
    'shareWith': username,
    'path': path
  }

  if (optionalParams) {
    if (optionalParams.perms) {
      postData.permissions = optionalParams.perms
    }

    if (optionalParams.remoteUser) {
      postData.shareType = helpers.OCS_SHARE_TYPE_REMOTE
    }
  }

  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 'shares', postData)
      .then(data => {
        var shareData = data.data.ocs.data
        var share = new ShareInfo(shareData)

        resolve(share)
      }).catch(error => {
        reject(error)
      })
  })
}

/**
 * Shares a remote file with specified group
 * @param   {string}    path             path to the remote file share
 * @param   {object}    optionalParams   {perms: integer}
 * @returns {Promise.<ShareInfo>}        instance of class ShareInfo
 * @returns {Promise.<error>}            string: error message, if any.
 */
Shares.prototype.shareFileWithGroup = function (path, groupName, optionalParams) {
  path = helpers._normalizePath(path)

  var postData = {
    'shareType': helpers.OCS_SHARE_TYPE_GROUP,
    'shareWith': groupName,
    'path': path
  }

  if (optionalParams && optionalParams.perms) {
    postData.permissions = optionalParams.perms
  }

  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 'shares', postData)
      .then(data => {
        var shareData = data.data.ocs.data
        var share = new ShareInfo(shareData)

        resolve(share)
      }).catch(error => {
        reject(error)
      })
  })
}

/**
 * Returns array of shares
 * @param   {string}  path            path to the file whose share needs to be checked
 * @param   {object}  optionalParams  object of values {"reshares": boolean,
 *                                    "subfiles": boolean, "shared_with_me": boolean}
 * @returns {Promise.<ShareInfo>}     Array of instances of class ShareInfo for all Shares
 * @returns {Promise.<error>}         string: error message, if any.
 */
Shares.prototype.getShares = function (path, optionalParams) {
  var data = 'shares'
  var send = {}

  if (path !== '') {
    data += '?'

    send.path = helpers._normalizePath(path)
    optionalParams = helpers._convertObjectToBool(optionalParams)

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
      }
      /* jshint camelcase: true */
    }

    var urlString = ''
    for (var key in send) {
      urlString += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(send[key])
    }
    urlString = urlString.slice(1) // removing the first '&'

    data += urlString
  }

  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_SHARE, data)
      .then(data => {
        var elements = data.data.ocs.data.element || []
        var shares = []

        if (elements && elements.constructor !== Array) {
          // just a single element
          elements = [elements]
        }
        for (var i = 0; i < elements.length; i++) {
          var share = new ShareInfo(elements[i])
          shares.push(share)
        }

        resolve(shares)
      }).catch(error => {
        reject(error)
      })
  })
}

/**
 * Checks wether a path is already shared
 * @param   {string}    path    path to the share to be checked
 * @returns {Promise.<status>}  boolean: true if shared
 * @returns {Promise.<error>}   string: error message, if any.
 */
Shares.prototype.isShared = function (path) {
  var self = this

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
Shares.prototype.getShare = function (shareId) {
  return new Promise((resolve, reject) => {
    if (isNaN((parseInt(shareId)))) {
      reject('Please pass a valid share ID (Integer)')
      return
    }
    helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_SHARE, 'shares/' + shareId.toString())
      .then(data => {
        var shareData = data.data.ocs.data.element
        var share = new ShareInfo(shareData)

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
Shares.prototype.listOpenRemoteShare = function () {
  return new Promise((resolve, reject) => {
    helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_SHARE, 'remote_shares/pending')
      .then(data => {
        var shares = data.data.ocs.data.element || []

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
Shares.prototype.acceptRemoteShare = function (shareId) {
  return new Promise((resolve, reject) => {
    if (isNaN((parseInt(shareId)))) {
      reject('Please pass a valid share ID (Integer)', null)
      return
    }

    /* jshint unused: false */
    helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE,
      'remote_shares/pending' + encodeURIComponent(shareId.toString())
    ).then(data => {
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
Shares.prototype.declineRemoteShare = function (shareId) {
  return new Promise((resolve, reject) => {
    if (isNaN((parseInt(shareId)))) {
      reject('Please pass a valid share ID (Integer)', null)
      return
    }

    /* jshint unused: false */
    helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_SHARE,
      'remote_shares/pending' + encodeURIComponent(shareId.toString())
    ).then(data => {
      resolve(true)
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Updates a given share
 * @param   {number}  shareId         ID of the share to update
 * @param   {object}   optionalParams  {perms: integer, publicUpload: boolean, password: string}
 * @returns {Promise.<status>}         boolean: true if successful
 * @returns {Promise.<error>}          string: error message, if any.
 */
Shares.prototype.updateShare = function (shareId, optionalParams) {
  let postData = {}

  if (optionalParams) {
    if (optionalParams.perms) {
      postData.permissions = optionalParams.perms
    }
    if (optionalParams.password) {
      postData.password = optionalParams.password
    }
    if (optionalParams.publicUpload && typeof (optionalParams.publicUpload) === 'boolean') {
      postData.publicUpload = optionalParams.publicUpload.toString().toLowerCase()
    }
  }

  /* jshint unused: false */
  return helpers._makeOCSrequest('PUT', helpers.OCS_SERVICE_SHARE,
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
Shares.prototype.deleteShare = function (shareId) {
  return new Promise((resolve, reject) => {
    if (isNaN((parseInt(shareId)))) {
      reject('Please pass a valid share ID (Integer)', null)
      return
    }

    /* jshint unused: false */
    helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_SHARE,
      'shares/' + encodeURIComponent(shareId.toString())
    ).then(data => {
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
 * @param {int} page
 * @param {int} perPage
 * @returns {Promise.<status>}    boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
Shares.prototype.getRecipients = function (search, itemType, page = 1, perPage = 200) {
  if (isNaN(parseInt(page)) || page < 1) {
    return Promise.reject(new Error('Please pass a valid page parameter (Integer)'))
  }
  if (isNaN(parseInt(perPage)) || perPage < 1) {
    return Promise.reject(new Error('Please pass a valid perPage parameter (Integer)'))
  }

  return helpers.ocs({
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

module.exports = Shares
