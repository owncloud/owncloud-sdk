const Promise = require('promise')
const dav = require('davclient.js')

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
    this.davClient = new dav.Client({
      baseUrl: this.helpers._webdavUrl,
      xmlNamespaces: {
        'DAV:': 'd',
        'http://owncloud.org/ns': 'oc'
      }
    })
  }

  /**
   * Lists files in a public link as determined by the given token
   *
   * @param {string} token
   * @param {string} password
   * @return {Promise<fileInfo[]>}
   */
  list (token, password = null) {
    let headers = this.helpers.buildHeaders(false)
    const path = '/public-files/' + token + '/'
    const properties = []
    const depth = '1'
    if (password) {
      headers['authorization'] = 'Basic ' + Buffer.from('public:' + password).toString('base64')
    }

    return this.davClient.propFind(this.helpers._buildFullWebDAVPathV2(path), properties, depth, headers).then(result => {
      if (result.status !== 207) {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(result.status, result.xhr.response))
      } else {
        return Promise.resolve(this.helpers._parseBody(result.body))
      }
    })
  }

  /**
   * Download the content of a file in a public link
   * @param token
   * @param path
   * @param password
   * @return {Promise<Response>}
   */
  download (token, path, password = null) {
    let headers = this.helpers.buildHeaders(false)
    const url = this.helpers._buildFullWebDAVPathV2('/public-files/' + token + '/' + path)

    if (password) {
      headers['authorization'] = 'Basic ' + Buffer.from('public:' + password).toString('base64')
    }
    const init = {
      method: 'GET',
      mode: 'cors',
      headers: headers
    }

    return fetch(url, init).then(resp => {
      if (resp.ok) {
        return Promise.resolve(resp)
      }
      return resp.text().then(body => {
        return Promise.reject(this.helpers.buildHttpErrorFromDavResponse(resp.status, body))
      })
    })
  }
}
module.exports = PublicFiles
