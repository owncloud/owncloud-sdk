const Promise = require('promise')
const dav = require('davclient.js')
const WebdavProperties = require('./properties')

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
 *          <li>mkdir</li>
 *          <li>createFolder</li>
 *          <li>delete</li>
 *          <li>fileInfo</li>
 *          <li>getDirectoryAsZip</li>
 *          <li>putFile</li>
 *          <li>putDirectory</li>
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
    this.davClient = new dav.Client({
      baseUrl: this.helpers._webdavUrl,
      xmlNamespaces: {
        'DAV:': 'd',
        'http://owncloud.org/ns': 'oc'
      }
    })
  }

  /**
   * Returns the listing/contents of the given remote directory
   * @param   {string}    path          path of the file/folder at OC instance
   * @param   {string}    depth         0: only file/folder, 1: upto 1 depth, infinity: infinite depth
   * @param   {array}     properties    Array[string] with dav properties to be requested
   * @returns {Promise.<File>}      Array[objects]: each object is an instance of class File
   * @returns {Promise.<error>}         string: error message, if any.
   */
  list (path, depth = '1') {
    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    const headers = this.helpers.buildHeaders()
    return this.davClient.propFind(this.helpers._buildFullWebDAVPath(path), WebdavProperties.BasicFileProperties, depth, headers).then(result => {
      if (result.status !== 207) {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.xhr.response))
      } else {
        return Promise.resolve(this.helpers._parseBody(result.body))
      }
    })
  }

  // /**
  //  * Returns the contents of a remote file
  //  * @param   {string}  path          path of the remote file at OC instance
  //  * @param   {Object} options
  //  * @returns {Promise.<string>}    string: contents of file
  //  * @returns {Promise.<error>}       string: error message, if any.
  //  */
  // getFileContents (path, options = {}) {
  //   return this.helpers._get(this.helpers._buildFullWebDAVPath(path)).then(data => {
  //     const response = data.response
  //     const body = data.body

  //     if (response.statusCode !== 200) {
  //       return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(response.status, body))
  //     }
  //     options = options || []
  //     const resolveWithResponseObject = options.resolveWithResponseObject || false
  //     if (resolveWithResponseObject) {
  //       return Promise.resolve({
  //         body: body,
  //         headers: {
  //           'ETag': response.getResponseHeader('etag'),
  //           'OC-FileId': response.getResponseHeader('oc-fileid')
  //         }
  //       })
  //     }
  //     return Promise.resolve(body)
  //   })
  // }

  /**
   * Returns the url of a remote file - using the version 1 endpoint
   * @param   {string}  path    path of the remote file at OC instance
   * @returns {string}          Url of the remote file
   */
  getFileUrl (path) {
    return this.helpers._buildFullWebDAVPath(path)
  }

  // /**
  //  * Returns the url of a remote file - using the version 2 endpoint
  //  * @param   {string}  path    path of the remote file at OC instance
  //  * @returns {string}          Url of the remote file
  //  */
  // getFileUrlV2 (path) {
  //   path = path[0] === '/' ? path : '/' + path
  //   const target = '/files/' + this.helpers.getCurrentUser().id + path
  //   return this.helpers._buildFullWebDAVPathV2(target)
  // }

  /**
   * Queries the server for the real path of the authenticated user for a given fileId
   *
   * @param  {number} fileId
   * @return {*|Promise<string>}
   */
  getPathForFileId (fileId) {
    const path = '/meta/' + fileId

    return this.davClient.propFind(this.helpers._buildFullWebDAVPathV2(path), [
      '{http://owncloud.org/ns}meta-path-for-user'
    ], 0, {
      'Authorization': this.helpers.getAuthorization()
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

    let requestOptions = {}
    if (options.onProgress) {
      requestOptions.onProgress = options.onProgress
    }

    return this.davClient.request('PUT', this.helpers._buildFullWebDAVPath(path), headers, content, null, requestOptions).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve({
          'ETag': result.xhr.getResponseHeader('etag'),
          'OC-FileId': result.xhr.getResponseHeader('oc-fileid')
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
  mkdir (path) {
    if (path[path.length - 1] !== '/') {
      path += '/'
    }

    if (!this.helpers.getAuthorization()) {
      return Promise.reject('Please specify an authorization first.')
    }

    return this.davClient.request('MKCOL', this.helpers._buildFullWebDAVPath(path), this.helpers.buildHeaders()).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        return Promise.resolve(true)
      }
      return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
    })
  }

  /**
   * Creates a remote directory
   * @param   {string}  path        path of the folder to be created at OC instance
   * @returns {Promise.<status>}    boolean: whether the operation was successful
   * @returns {Promise.<error>}     string: error message, if any.
   */
  createFolder (path) {
    return this.mkdir(path)
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
   * @returns {Promise.<File>}                      object: instance of class File
   * @returns {Promise.<error>}                         string: error message, if any.
   */
  fileInfo (path) {
    return this.list(path, '0', WebdavProperties.BasicFileProperties).then(fileInfo => {
      return Promise.resolve(fileInfo[0])
    })
  }

  /**
   * Helper for putDirectory
   * This function first makes all the directories required
   * @param  {object}     array    file list (ls -R) of the directory to be put
   * @return {Promise.<status>}    boolean: whether mkdir was successful
   * @returns {Promise.<error>}    string: error message, if any.
   */
  recursiveMkdir (array) {
    const self = this
    return new Promise(function (resolve, reject) {
      self.mkdir(array[0].path).then(() => {
        array.shift()
        if (array.length === 0) {
          resolve(true)
          return
        }
        self.recursiveMkdir(array).then(() => {
          resolve(true)
        }).catch(err => {
          reject(err)
        })
      }).catch(error => {
        reject(error)
      })
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

    const headers = this.helpers.buildHeaders()
    headers['Destination'] = this.helpers._buildFullWebDAVPath(target)
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

    const headers = this.helpers.buildHeaders()
    headers['Destination'] = this.helpers._buildFullWebDAVPath(target)
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
   * @returns {Promise.<File[]>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}       string: error message, if any.
   */
  search (pattern, limit) {
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
    body += this._renderProperties(WebdavProperties.BasicFileProperties)

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
   * @returns {Promise.<File[]>}  boolean: whether the operation was successful
   * @returns {Promise.<error>}       string: error message, if any.
   */
  getFavoriteFiles () {
    let body =
      '<?xml version="1.0"?>\n' +
      '<oc:filter-files '
    let namespace
    for (namespace in this.davClient.xmlNamespaces) {
      body += ' xmlns:' + this.davClient.xmlNamespaces[namespace] + '="' + namespace + '"'
    }
    body += '>\n'

    body += this._renderProperties(WebdavProperties.BasicFileProperties)

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

    for (let ii in properties) {
      if (!properties.hasOwnProperty(ii)) {
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
   * @returns {Promise.<File[]>}  boolean: whether the operation was successful
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
    for (let tag in tags) {
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

      return this.davClient.request('REPORT', this.helpers._buildFullWebDAVPathV2(path), headers, body).then(result => {
        if (result.status !== 207) {
          return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.body))
        } else {
          return Promise.resolve(this.helpers._parseBody(result.body, 2))
        }
      })
    })
  }
}
module.exports = Files
