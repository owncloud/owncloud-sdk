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
   * @param {string}      token
   * @param {string|null} password
   * @param {array}       properties
   * @param {string}      depth
   * @return {Promise<FileInfo[]>}
   */
  list (token, password = null, properties = [], depth = '1') {
    let headers = this.helpers.buildHeaders(false)
    const path = '/public-files/' + token + '/'
    if (password) {
      headers['authorization'] = 'Basic ' + Buffer.from('public:' + password).toString('base64')
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
   * @param  {string}       token    public share token
   * @param  {string}       path     path to a file in the share
   * @param  {string|null}  password
   * @return {Promise<Response>}
   */
  download (token, path, password = null) {
    let headers = this.helpers.buildHeaders(false)
    const url = this.getFileUrl(token, path)

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

  /**
   * Returns the url of a public file
   * @param  {string}  token    public share token
   * @param  {string}  path     path to a file in the share
   * @return {string}           Url of the public file
   */
  getFileUrl (token, path) {
    return this.helpers._buildFullWebDAVPathV2('/public-files/' + token + '/' + path)
  }
}
module.exports = PublicFiles
