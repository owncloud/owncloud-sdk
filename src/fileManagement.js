const Promise = require('promise')
const { Dav } = require('./dav')

/**
 * @class Files
 * @classdesc
 * <b><i> The Files class, has all the methods for your ownCloud files management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *  <li><b>Files Management</b>
 *      <ul>
 *          <li>list</li>
 *          <li>getFileContents</li>
 *          <li>putFileContents</li>
 *          <li>createFolder</li>
 *          <li>delete</li>
 *          <li>fileInfo</li>
 *          <li>move</li>
 *          <li>copy</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param   {helpers}    helperFile  instance of the helpers class
 */
class Files {
  constructor (helperFile) {
    this.helpers = helperFile

    this.davClient = new Dav(this.helpers._webdavUrl, this.helpers._davPath)
  }

  /**
   * Returns the listing/contents of the given remote directory
   * @param   {string}    path          path of the file/folder at OC instance
   * @param   {string}    depth         0: only file/folder, 1: upto 1 depth, infinity: infinite depth
   * @param   {array}     properties    Array[string] with dav properties to be requested
   * @returns {Promise.<fileInfo>}      Array[objects]: each object is an instance of class fileInfo
   * @returns {Promise.<error>}         string: error message, if any.
   */
  list (path, depth = '1', properties = []) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    if (!this.helpers.getCurrentUser()) {
      return Promise.reject(new Error('Username or password was incorrect'))
    }

    path = this._sanitizePath(path)
    const headers = this.helpers.buildHeaders()
    return this.davClient.propFind(this.helpers._buildFullWebDAVPath(path), properties, depth, headers).then(result => {
      if (result.status !== 207) {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
      } else {
        const entries = this.helpers._parseBody(result.body)
        entries[0].tusSupport = this.helpers._parseTusHeaders(result.res)
        return Promise.resolve(entries)
      }
    })
  }

  /**
   * Returns the contents of a remote file
   * @param   {string}  path          path of the remote file at OC instance
   * @param   {Object} options
   * @returns {Promise.<string>}    string: contents of file
   * @returns {Promise.<error>}       string: error message, if any.
   */
  getFileContents (path, options = {}) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    if (!this.helpers.getCurrentUser()) {
      return Promise.reject(new Error('Username or password was incorrect'))
    }

    path = this._sanitizePath(path)

    return this.helpers._get(this.helpers._buildFullWebDAVURL(path), options).then(data => {
      const response = data.response
      const body = data.body

      if (response.statusCode !== 200) {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(response.status, body))
      }
      options = options || []
      const resolveWithResponseObject = options.resolveWithResponseObject || false
      if (resolveWithResponseObject) {
        return Promise.resolve({
          body: body,
          headers: {
            ETag: response.headers.get('etag'),
            'OC-FileId': response.headers.get('oc-fileid')
          }
        })
      }
      return Promise.resolve(body)
    })
  }

  /**
   * Returns the url of a remote file - using the version 2 endpoint
   * @param   {string}  path    path of the remote file at OC instance
   * @returns {string}          Url of the remote file
   */
  getFileUrl (path) {
    path = this._sanitizePath(path)
    path = path[0] === '/' ? path : '/' + path
    return this.helpers._buildFullWebDAVURL(path)
  }

  /**
   * Queries the server for the real path of the authenticated user for a given fileId
   *
   * @param  {number} fileId
   * @return {*|Promise<string>}
   */
  getPathForFileId (fileId) {
    const path = '/meta/' + fileId

    return this.davClient.propFind(this.helpers._buildFullWebDAVPath(path), [
      '{http://owncloud.org/ns}meta-path-for-user'
    ], 0, {
      Authorization: this.helpers.getAuthorization()
    }).then(result => {
      if (result.status !== 207) {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
      }
      const file = this.helpers._parseBody(result.body)
      return Promise.resolve(file[0].getProperty('{http://owncloud.org/ns}meta-path-for-user'))
    })
  }

  /**
   * Write data into a remote file
   * @param   {string} path       path of the file at OC instance
   * @param   {string} content    content to be put
   * @param   {Object} options
   * @param   {Object} [options.headers] optional extra headers
   * @param   {boolean} [options.overwrite] whether to force-overwrite the target
   * @param   {String} [options.previousEntityTag] previous entity tag to avoid concurrent overwrites
   * @param   {Function} options.onProgress progress callback
   * @returns {Promise.<status>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}   string: error message, if any.
   */
  putFileContents (path, content, options = {}) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    if (!this.helpers.getCurrentUser()) {
      return Promise.reject(new Error('Username or password was incorrect'))
    }

    path = this._sanitizePath(path)
    options = options || []
    const headers = Object.assign({}, this.helpers.buildHeaders(), options.headers)
    const previousEntityTag = options.previousEntityTag || false
    if (previousEntityTag) {
      // will ensure that no other client uploaded a different version meanwhile
      headers['If-Match'] = previousEntityTag
    } else if (!options.overwrite) {
      // will trigger 412 precondition failed if a file already exists
      headers['If-None-Match'] = '*'
    }

    const requestOptions = {}
    if (options.onProgress) {
      requestOptions.onUploadProgress = options.onProgress
    }
    headers['Content-Type'] = 'text/plain;charset=utf-8'

    return this.davClient.request('PUT', this.helpers._buildFullWebDAVPath(path), headers, content, requestOptions).then(result => {
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
   * Creates a remote directory
   * @param   {string} path       path of the folder to be created at OC instance
   * @returns {Promise.<status>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}   string: error message, if any.
   */
  createFolder (path) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    if (!this.helpers.getCurrentUser()) {
      return Promise.reject(new Error('Username or password was incorrect'))
    }

    path = this._sanitizePath(path)
    if (path[path.length - 1] !== '/') {
      path += '/'
    }

    return this.davClient.request('MKCOL', this.helpers._buildFullWebDAVPath(path), this.helpers.buildHeaders()).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      }
      return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
    })
  }

  /**
   * Deletes a remote file or directory
   * @param   {string}  path        path of the file/folder at OC instance
   * @returns {Promise.<status>}    boolean: whether the operation was successful
   * @returns {Promise.<error>}     string: error message, if any.
   */
  delete (path) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    if (!this.helpers.getCurrentUser()) {
      return Promise.reject(new Error('Username or password was incorrect'))
    }

    path = this._sanitizePath(path)

    return this.davClient.request('DELETE', this.helpers._buildFullWebDAVPath(path), this.helpers.buildHeaders()).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      } else {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
      }
    })
  }

  /**
   * Returns the file info for the given remote file
   * @param   {string}                    path          path of the file/folder at OC instance
   * @param   {Object.<string, string>}   properties    WebDAV properties
   * @returns {Promise.<FileInfo>}                      object: instance of class fileInfo
   * @returns {Promise.<error>}                         string: error message, if any.
   */
  fileInfo (path, properties) {
    return this.list(path, '0', properties).then(fileInfo => {
      return Promise.resolve(fileInfo[0])
    })
  }

  /**
   * Moves a remote file or directory
   * @param   {string} source     initial path of file/folder
   * @param   {string} target     path where to move file/folder finally
   * @returns {Promise.<status>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}   string: error message, if any.
   */
  move (source, target) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    if (!this.helpers.getCurrentUser()) {
      return Promise.reject(new Error('Username or password was incorrect'))
    }

    source = this._sanitizePath(source)
    target = this._sanitizePath(target)

    const headers = this.helpers.buildHeaders()
    headers.Destination = this.helpers._buildFullWebDAVURL(target)
    return this.davClient.request('MOVE', this.helpers._buildFullWebDAVPath(source), headers).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      }
      return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
    })
  }

  /**
   * Copies a remote file or directory
   * @param   {string} source     initial path of file/folder
   * @param   {string} target     path where to copy file/folder finally
   * @returns {Promise.<status>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}   string: error message, if any.
   */
  copy (source, target) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    if (!this.helpers.getCurrentUser()) {
      return Promise.reject(new Error('Username or password was incorrect'))
    }

    source = this._sanitizePath(source)
    target = this._sanitizePath(target)

    const headers = this.helpers.buildHeaders()
    headers.Destination = this.helpers._buildFullWebDAVURL(target)
    return this.davClient.request('COPY', this.helpers._buildFullWebDAVPath(source), headers).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      }
      return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
    })
  }

  /**
   * Mark a remote file or directory as favorite
   * @param   {string} path       path of file/folder
   * @param   {boolean} value     Add or remove the favorite marker of a file/folder
   * @returns {Promise.<status>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}   string: error message, if any.
   */
  favorite (path, value = true) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    if (!this.helpers.getCurrentUser()) {
      return Promise.reject(new Error('Username or password was incorrect'))
    }

    path = this._sanitizePath(path)

    return this.davClient.propPatch(this.helpers._buildFullWebDAVPath(path), {
      '{http://owncloud.org/ns}favorite': value ? 'true' : 'false'
    }, this.helpers.buildHeaders()).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      }
      return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
    })
  }

  /**
   * Search in all files of the user for a given pattern
   * @param   {string} pattern        pattern to be searched for
   * @param   {number} limit          maximum number of results
   * @param   {string[]} properties   list of DAV properties which are expected in the response
   * @returns {Promise.<FileInfo[]>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}       string: error message, if any.
   */
  search (pattern, limit, properties) {
    pattern = pattern || ''
    limit = limit || 30

    let body =
      '<?xml version="1.0"?>\n' +
      '<oc:search-files '
    let namespace
    for (namespace in this.davClient.xmlNamespaces) {
      body += ' xmlns:' + this.davClient.xmlNamespaces[namespace] + '="' + namespace + '"'
    }
    body += '>\n'
    body += this._renderProperties(properties)

    body +=
      '  <oc:search>\n' +
      '    <oc:pattern>' + this.helpers.escapeXml(pattern) + '</oc:pattern>\n' +
      '    <oc:limit>' + this.helpers.escapeXml(limit) + '</oc:limit>\n' +
      '  </oc:search>\n' +
      '</oc:search-files>'

    return this._sendDavReport(body)
  }

  /**
   * Get all favorite files and folder of the user
   * @param   {string[]} properties   list of DAV properties which are expected in the response
   * @returns {Promise.<FileInfo[]>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}       string: error message, if any.
   */
  getFavoriteFiles (properties) {
    let body =
      '<?xml version="1.0"?>\n' +
      '<oc:filter-files '
    let namespace
    for (namespace in this.davClient.xmlNamespaces) {
      body += ' xmlns:' + this.davClient.xmlNamespaces[namespace] + '="' + namespace + '"'
    }
    body += '>\n'

    body += this._renderProperties(properties)

    body +=
      '<oc:filter-rules>\n' +
      '<oc:favorite>1</oc:favorite>\n' +
      '</oc:filter-rules>\n' +
      '</oc:filter-files>'

    return this._sendDavReport(body)
  }

  _renderProperties (properties) {
    if (!properties) {
      return ''
    }
    let body = '  <d:prop>\n'

    for (const ii in properties) {
      if (!Object.prototype.hasOwnProperty.call(properties, ii)) {
        continue
      }

      const property = this.davClient.parseClarkNotation(properties[ii])
      if (this.davClient.xmlNamespaces[property.namespace]) {
        body += '    <' + this.davClient.xmlNamespaces[property.namespace] + ':' + property.name + ' />\n'
      } else {
        body += '    <x:' + property.name + ' xmlns:x="' + property.namespace + '" />\n'
      }
    }
    body += '  </d:prop>\n'
    return body
  }

  /**
   * Get all files and folder of the user for a given list of tags
   * @param   {number[]} tags            list of tag ids
   * @param   {string[]} properties   list of DAV properties which are expected in the response
   * @returns {Promise.<FileInfo[]>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}       string: error message, if any.
   */
  getFilesByTags (tags, properties) {
    let body =
      '<?xml version="1.0"?>\n' +
      '<oc:filter-files '
    let namespace
    for (namespace in this.davClient.xmlNamespaces) {
      body += ' xmlns:' + this.davClient.xmlNamespaces[namespace] + '="' + namespace + '"'
    }
    body += '>\n'
    body += this._renderProperties(properties)

    body += '<oc:filter-rules>'
    for (const tag in tags) {
      body += '<oc:systemtag>'
      body += tags[tag]
      body += '</oc:systemtag>'
    }

    body += '</oc:filter-rules>'
    body += '</oc:filter-files>'

    return this._sendDavReport(body)
  }

  _sendDavReport (body) {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    return this.helpers.getCurrentUserAsync().then(user => {
      const path = '/files/' + user.id + '/'

      const headers = this.helpers.buildHeaders()
      headers['Content-Type'] = 'application/xml; charset=utf-8'

      return this.davClient.request('REPORT', path, headers, body).then(result => {
        if (result.status !== 207) {
          return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
        } else {
          return Promise.resolve(this.helpers._parseBody(result.body, 2))
        }
      })
    })
  }

  _sanitizePath (path) {
    path = path || ''
    // Remove leading slash if present
    path = path.startsWith('/') ? path.substr(1) : path
    return '/files/' + this.helpers.getCurrentUser().id + '/' + path
  }
}
module.exports = Files
