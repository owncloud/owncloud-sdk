const Promise = require('promise')
const dav = require('davclient.js')
let helpers
let davClient

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
function Files (helperFile) {
  helpers = helperFile
  davClient = new dav.Client({
    baseUrl: helpers._webdavUrl,
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
 * @returns {Promise.<fileInfo>}      Array[objects]: each object is an instance of class fileInfo
 * @returns {Promise.<error>}         string: error message, if any.
 */
Files.prototype.list = function (path, depth, properties) {
  if (typeof depth === 'undefined') {
    depth = 1
  }

  if (typeof properties === 'undefined') {
    properties = []
  }

  return new Promise((resolve, reject) => {
    if (!helpers.getAuthorization()) {
      reject('Please specify an authorization first.')
      return
    }

    const headers = helpers.buildHeaders()
    davClient.propFind(helpers._buildFullWebDAVPath(path), properties, depth, headers).then(result => {
      if (result.status !== 207) {
        reject(helpers._parseDAVerror(result.xhr.response))
      } else {
        resolve(helpers._parseBody(result.body))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Returns the contents of a remote file
 * @param   {string}  path          path of the remote file at OC instance
 * @returns {Promise.<contents>}    string: contents of file
 * @returns {Promise.<error>}       string: error message, if any.
 */
Files.prototype.getFileContents = function (path) {
  return new Promise((resolve, reject) => {
    // TODO: use davclient ?
    helpers._get(helpers._buildFullWebDAVPath(path)).then(data => {
      var response = data.response
      var body = data.body

      if (response.statusCode === 200) {
        resolve(body)
      } else {
        var err = helpers._parseDAVerror(body)
        reject(err)
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Returns the url of a remote file
 * @param   {string}  path    path of the remote file at OC instance
 * @returns {string}          Url of the remote file
 */
Files.prototype.getFileUrl = function (path) {
  return helpers._buildFullWebDAVPath(path)
}

/**
 * Write data into a remote file
 * @param   {string} path       path of the file at OC instance
 * @param   {string} content    content to be put
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
Files.prototype.putFileContents = function (path, content, options) {
  return new Promise((resolve, reject) => {
    if (!helpers.getAuthorization()) {
      reject('Please specify an authorization first.')
      return
    }
    options = options || []
    const headers = helpers.buildHeaders()
    const previousEntityTag = options.previousEntityTag || false
    if (previousEntityTag) {
      // will ensure that no other client uploaded a different version meanwhile
      headers['If-Match'] = previousEntityTag
    } else {
      // will trigger 412 precondition failed if a file already exists
      headers['If-None-Match'] = '*'
    }

    davClient.request('PUT', helpers._buildFullWebDAVPath(path), headers, content).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        resolve({
          'ETag': result.xhr.getResponseHeader('etag'),
          'OC-FileId': result.xhr.getResponseHeader('oc-fileid')
        })
      } else {
        reject(helpers._parseDAVerror(result.body))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Creates a remote directory
 * @param   {string} path       path of the folder to be created at OC instance
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
Files.prototype.mkdir = function (path) {
  if (path[path.length - 1] !== '/') {
    path += '/'
  }

  return new Promise((resolve, reject) => {
    if (!helpers.getAuthorization()) {
      reject('Please specify an authorization first.')
      return
    }

    davClient.request('MKCOL', helpers._buildFullWebDAVPath(path), helpers.buildHeaders()).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        resolve(true)
      } else {
        reject(helpers._parseDAVerror(result.body))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Creates a remote directory
 * @param   {string}  path        path of the folder to be created at OC instance
 * @returns {Promise.<status>}    boolean: wether the operation was successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
Files.prototype.createFolder = function (path) {
  return this.mkdir(path)
}

/**
 * Deletes a remote file or directory
 * @param   {string}  remotePath  path of the file/folder at OC instance
 * @returns {Promise.<status>}    boolean: wether the operation was successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
Files.prototype.delete = function (path) {
  return new Promise((resolve, reject) => {
    if (!helpers.getAuthorization()) {
      reject('Please specify an authorization first.')
      return
    }

    davClient.request('DELETE', helpers._buildFullWebDAVPath(path), helpers.buildHeaders()).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        resolve(true)
      } else {
        reject(helpers._parseDAVerror(result.body))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Returns the file info for the given remote file
 * @param   {string}                    path          path of the file/folder at OC instance
 * @param   {Object.<string, string>}   properties    WebDAV properties
 * @returns {Promise.<fileInfo>}                      object: instance of class fileInfo
 * @returns {Promise.<error>}                         string: error message, if any.
 */
Files.prototype.fileInfo = function (path, properties) {
  return new Promise((resolve, reject) => {
    this.list(path, '0', properties).then(fileInfo => {
      resolve(fileInfo[0])
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Helper for putDirectory
 * This function first makes all the directories required
 * @param  {object}     array    file list (ls -R) of the directory to be put
 * @return {Promise.<status>}    boolean: wether mkdir was successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
Files.prototype.recursiveMkdir = function (array) {
  var self = this
  return new Promise(function (resolve, reject) {
    self.mkdir(array[0].path).then(status => {
      array.shift()
      if (array.length === 0) {
        resolve(true)
        return
      }
      self.recursiveMkdir(array).then(status2 => {
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
Files.prototype.move = function (source, target) {
  return new Promise((resolve, reject) => {
    if (!helpers.getAuthorization()) {
      reject('Please specify an authorization first.')
      return
    }

    const headers = helpers.buildHeaders()
    headers['Destination'] = helpers._buildFullWebDAVPath(target)
    davClient.request('MOVE', helpers._buildFullWebDAVPath(source), headers).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        resolve(true)
      } else {
        reject(helpers._parseDAVerror(result.body))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Copies a remote file or directory
 * @param   {string} source     initial path of file/folder
 * @param   {string} target     path where to copy file/folder finally
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
Files.prototype.copy = function (source, target) {
  return new Promise((resolve, reject) => {
    if (!helpers.getAuthorization()) {
      reject('Please specify an authorization first.')
      return
    }

    const headers = helpers.buildHeaders()
    headers['Destination'] = helpers._buildFullWebDAVPath(target)
    davClient.request('COPY', helpers._buildFullWebDAVPath(source), headers).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        resolve(true)
      } else {
        reject(helpers._parseDAVerror(result.body))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * Mark a remote file or directory as favorite
 * @param   {string} path       path of file/folder
 * @param   {boolean} value     Add or remove the favorite marker of a file/folder
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
Files.prototype.favorite = function (path, value) {
  if (typeof value === 'undefined') {
    value = true
  }
  return new Promise((resolve, reject) => {
    if (!helpers.getAuthorization()) {
      reject('Please specify an authorization first.')
    }
    davClient.propPatch(helpers._buildFullWebDAVPath(path), {
      '{http://owncloud.org/ns}favorite': value ? 'true' : 'false'
    }, helpers.buildHeaders()).then(result => {
      if ([200, 201, 204, 207].indexOf(result.status) > -1) {
        resolve(true)
      } else {
        reject(helpers._parseDAVerror(result.body))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

Files.prototype.search = function (pattern, limit, properties) {
  pattern = pattern || ''
  limit = limit || 30

  return new Promise((resolve, reject) => {
    if (!helpers.getAuthorization()) {
      reject('Please specify an authorization first.')
      return
    }

    let body =
      '<?xml version="1.0"?>\n' +
      '<oc:search-files '
    let namespace
    for (namespace in davClient.xmlNamespaces) {
      body += ' xmlns:' + davClient.xmlNamespaces[namespace] + '="' + namespace + '"'
    }
    body += '>\n'

    if (properties) {
      body += '  <d:prop>\n'

      for (var ii in properties) {
        if (!properties.hasOwnProperty(ii)) {
          continue
        }

        const property = davClient.parseClarkNotation(properties[ii])
        if (davClient.xmlNamespaces[property.namespace]) {
          body += '    <' + davClient.xmlNamespaces[property.namespace] + ':' + property.name + ' />\n'
        } else {
          body += '    <x:' + property.name + ' xmlns:x="' + property.namespace + '" />\n'
        }
      }
      body += '  </d:prop>\n'
    }

    body +=
    '  <oc:search>\n' +
    '    <oc:pattern>' + helpers.escapeXml(pattern) + '</oc:pattern>\n' +
    '    <oc:limit>' + helpers.escapeXml(limit) + '</oc:limit>\n' +
    '  </oc:search>\n' +
    '</oc:search-files>'

    helpers.getCurrentUserAsync().then(user => {
      const path = '/files/' + user.id + '/'

      const headers = helpers.buildHeaders()
      headers['Content-Type'] = helpers._buildFullWebDAVPath('application/xml; charset=utf-8')

      davClient.request('REPORT', helpers._buildFullWebDAVPathV2(path), headers, body).then(result => {
        if (result.status !== 207) {
          resolve(null)
        } else {
          resolve(helpers._parseBody(result.body, 2))
        }
      }).catch(error => {
        reject(error)
      })
    })
  })
}

module.exports = Files
