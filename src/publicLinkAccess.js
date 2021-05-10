const Promise = require('promise')
const { Dav } = require('./dav')

/**
 * @class PublicFiles
 * @classdesc
 * <b><i> The PublicFiles class allows access to all file and folders in a public link..</i></b><br><br>
 *
 * @author Thomas Müller
 * @version 1.0.0
 * @param   {helpers}    helperFile  instance of the helpers class
 */
class PublicFiles {
  constructor (helperFile) {
    this.helpers = helperFile

    this.davClient = new Dav(this.helpers._webdavUrl, this.helpers._davPath)

    // constant definitions
    this.PUBLIC_LINK_ITEM_TYPE = '{http://owncloud.org/ns}public-link-item-type'
    this.PUBLIC_LINK_PERMISSION = '{http://owncloud.org/ns}public-link-permission'
    this.PUBLIC_LINK_EXPIRATION = '{http://owncloud.org/ns}public-link-expiration'
    this.PUBLIC_LINK_SHARE_DATETIME = '{http://owncloud.org/ns}public-link-share-datetime'
    this.PUBLIC_LINK_SHARE_OWNER = '{http://owncloud.org/ns}public-link-share-owner'
  }

  /**
   * Lists files in a public link as determined by the given token
   *
   * @param {string}      tokenAndPath
   * @param {string}      path
   * @param {string|null} password
   * @param {array}       properties
   * @param {string}      depth
   * @return {FileInfo[]}
   */
  async list (tokenAndPath, password = null, properties = [], depth = '1') {
    const headers = this.helpers.buildHeaders(false)
    const url = this.getFileSharePath(tokenAndPath)

    // Dont use default bearer token for public links in web
    // this will lead to the link not being accessible
    this.helpers.noAuth()
    if (password) {
      headers.Authorization = 'Basic ' + Buffer.from('public:' + password).toString('base64')
    }

    if (properties.length === 0) {
      properties = [
        this.PUBLIC_LINK_ITEM_TYPE,
        this.PUBLIC_LINK_PERMISSION,
        this.PUBLIC_LINK_EXPIRATION,
        this.PUBLIC_LINK_SHARE_DATETIME,
        this.PUBLIC_LINK_SHARE_OWNER,
        '{DAV:}getcontenttype'
      ]
    }

    const result = await this.davClient.propFind(url, properties, depth, headers, { version: 'v2' })

    if (result.status === 207) {
      return this.helpers._parseBody(result.body, 1)
    }

    return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.res.body))
  }

  /**
   * Download the content of a file in a public link
   * @param  {string}       token    public share token - may contain the path as well
   * @param  {string|null}  path     path to a file in the share
   * @param  {string|null}  password
   * @return {Promise<Response>}
   */
  download (token, path = null, password = null) {
    const headers = this.helpers.buildHeaders(false)
    const url = this.getFileUrl(token, path)

    if (password) {
      headers.Authorization = 'Basic ' + Buffer.from('public:' + password).toString('base64')
    }
    const init = {
      method: 'GET',
      mode: 'cors',
      headers: headers
    }

    return this.helpers.fetch(url, init).then(resp => {
      if (resp.ok) {
        return Promise.resolve(resp)
      }
      return resp.text().then(body => {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(resp.status, body))
      })
    })
  }

  /**
   * Returns the url of a public file
   * @param  {string}       token  public share token - may contain the path as well
   * @param  {string|null}  path   path to a file in the share
   * @return {string}              Url of the public file
   */
  getFileUrl (token, path = null) {
    token = token.replace(/^\//, '')
    if (path) {
      // In case of the path starting with a "/" we remove it
      path = path.replace(/^\//, '')

      return this.helpers._buildFullWebDAVURLV2('/public-files/' + token + '/' + path)
    }

    return this.helpers._buildFullWebDAVURLV2('/public-files/' + token)
  }

  /**
   * Returns the url of a public file
   * @param  {string}       token  public share token - may contain the path as well
   * @param  {string|null}  path   path to a file in the share
   * @return {string}              Url of the public file
   */
  getFileSharePath (token, path = null) {
    token = token.replace(/^\//, '')
    if (path) {
      // In case of the path starting with a "/" we remove it
      path = path.replace(/^\//, '')

      return this.helpers._buildFullWebDAVPathV2('/public-files/' + token + '/' + path)
    }

    return this.helpers._buildFullWebDAVPathV2('/public-files/' + token)
  }

  /**
   * Creates a remote directory in a public folder
   * @param  {string}            token      public share token - may contain the path as well
   * @param  {string|null}       path       path of the folder to be created at OC instance
   * @param  {string|null}       password
   * @return {Promise.<status>}  boolean: whether the operation was successful
   * @return {Promise.<error>}   string: error message, if any.
   */
  createFolder (token, path = null, password = null) {
    const headers = this.helpers.buildHeaders(false)
    const url = this.getFileSharePath(token, path)

    if (password) {
      headers.Authorization = 'Basic ' + Buffer.from('public:' + password).toString('base64')
    }

    return this.davClient.request('MKCOL', url, headers, null, { version: 'v2' }).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      }
      return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
    })
  }

  /**
   * Deletes a remote file or directory in a public folder
   * @param  {string}            token      public share token - may contain the path as well
   * @param  {string|null}       path       path of the folder to be created at OC instance
   * @param  {string|null}       password
   * @return {Promise.<status>}    boolean: whether the operation was successful
   * @return {Promise.<error>}     string: error message, if any.
   */
  delete (token, path = null, password = null) {
    const headers = this.helpers.buildHeaders(false)
    const url = this.getFileSharePath(token, path)

    if (password) {
      headers.Authorization = 'Basic ' + Buffer.from('public:' + password).toString('base64')
    }

    return this.davClient.request('DELETE', url, headers, null, { version: 'v2' }).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      } else {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
      }
    })
  }

  /**
   * Write data into a remote file
   * @param  {string}            token      public share token - may contain the path as well
   * @param  {string|null}       path       path of the folder to be created at OC instance
   * @param  {string|null}       password
   * @param  {string} content    content to be put
   * @param  {Object} options
   * @param  {Object} [options.headers] optional extra headers
   * @param  {boolean} [options.overwrite] whether to force-overwrite the target
   * @param  {String} [options.previousEntityTag] previous entity tag to avoid concurrent overwrites
   * @param  {Function} options.onProgress progress callback
   * @return {Promise.<status>}  boolean: whether the operation was successful
   * @return {Promise.<error>}   string: error message, if any.
   */
  putFileContents (token, path = null, password = null, content = '', options = {}) {
    const headers = Object.assign({}, this.helpers.buildHeaders(), options.headers)
    const url = this.getFileSharePath(token, path)

    if (password) {
      headers.Authorization = 'Basic ' + Buffer.from('public:' + password).toString('base64')
    }
    const previousEntityTag = options.previousEntityTag || false
    if (previousEntityTag) {
      // will ensure that no other client uploaded a different version meanwhile
      headers['If-Match'] = previousEntityTag
    } else if (!options.overwrite) {
      // will trigger 412 precondition failed if a file already exists
      headers['If-None-Match'] = '*'
    }

    const requestOptions = { version: 'v2' }
    if (options.onProgress) {
      requestOptions.onProgress = options.onProgress
    }
    return this.davClient.request('PUT', url, headers, content, requestOptions).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve({
          ETag: result.res.headers.etag,
          'OC-FileId': result.res.headers['oc-fileid']
        })
      } else {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
      }
    })
  }

  /**
   * Moves a remote file or directory
   * @param  {string} source     initial path of file/folder - including the token aka root folder
   * @param  {string} target     path where to move file/folder finally - including the token aka root folder
   * @param  {string|null}       password
   * @return {Promise.<status>}  boolean: whether the operation was successful
   * @return {Promise.<error>}   string: error message, if any.
   */
  move (source, target, password = null) {
    const headers = this.helpers.buildHeaders(false)
    const sourceUrl = this.getFileSharePath(source)
    const targetUrl = this.getFileUrl(target)

    if (password) {
      headers.Authorization = 'Basic ' + Buffer.from('public:' + password).toString('base64')
    }
    headers.Destination = targetUrl
    return this.davClient.request('MOVE', sourceUrl, headers, null, { version: 'v2' }).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      }
      return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
    })
  }

  /**
   * Copies a remote file or directory
   * @param  {string} source     initial path of file/folder - including the token aka root folder
   * @param  {string} target     path where to copy file/folder finally - including the token aka root folder
   * @param  {string|null}       password
   * @return {Promise.<status>}  boolean: whether the operation was successful
   * @return {Promise.<error>}   string: error message, if any.
   */
  copy (source, target, password = null) {
    const headers = this.helpers.buildHeaders(false)
    const sourceUrl = this.getFileSharePath(source)
    const targetUrl = this.getFileUrl(target)

    if (password) {
      headers.Authorization = 'Basic ' + Buffer.from('public:' + password).toString('base64')
    }
    headers.Destination = targetUrl
    return this.davClient.request('COPY', sourceUrl, headers, null, { version: 'v2' }).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      }
      return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
    })
  }

  /**
   * Returns the file info for the given public resource
   * @param {string} tokenAndPath public share token and path to the resource
   * @param {string|null} password public link's password
   * @param {Array} properties WebDAV properties
   * @returns {FileInfo} instance of class fileInfo
   * @returns {Promise.<error>} error, if exists.
   */
  async getFileInfo (tokenAndPath, password = null, properties = []) {
    const fileInfo = await this.list(tokenAndPath, password, properties, '0')

    return fileInfo[0] ? fileInfo[0] : fileInfo
  }
}

module.exports = PublicFiles
