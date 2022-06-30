/**
 * @class FileInfo
 * @classdesc FileInfo class, stores information regarding a file/folder
 * @param   {string}    name            name of file/folder
 * @param   {string}    type            "file" => file ; "dir" => folder
 * @param   {string}    attr            attributes of file like size, time added etc.
 * @param   {boolean}   processing
 */
class FileInfo {
  constructor (name, type, attr, processing = false) {
    this.name = name
    this.type = type
    this.type = type
    this.processing = processing
    this.fileInfo = {}
    this.tusSupport = null

    for (const key in attr) {
      this.fileInfo[key] = attr[key]
    }
  }

  /**
   * Gets the name of file/folder
   * @returns {string}    name of file/folder
   */
  getName () {
    let name = this.name.split('/')
    name = name.filter(function (n) {
      return n !== ''
    })
    return name[name.length - 1]
  }

  /**
   * Gets path of file/folder
   * @returns {string}    Path of file/folder
   */
  getPath () {
    let name = this.name.split('/')
    name = name.filter(function (n) {
      return n !== ''
    })
    let send = '/'
    for (let i = 0; i < name.length - 1; i++) {
      send += name[i] + '/'
    }

    return send
  }

  /**
   * Gets size of the file/folder
   * @returns {number}   Size of file/folder
   */
  getSize () {
    return parseInt(this.fileInfo['{DAV:}getcontentlength']) || null
  }

  /**
   * Gets the file id
   * @returns {string}    file id
   */
  getFileId () {
    return this.fileInfo['{http://owncloud.org/ns}fileid'] || null
  }

  /**
   * Gets ETag of file/folder
   * @returns {string}    ETag of file/folder
   */
  getETag () {
    return this.fileInfo['{DAV:}getetag'] || null
  }

  /**
   * Gets content-type of file/folder
   * @returns {string}    content-type of file/folder
   */
  getContentType () {
    let type = this.fileInfo['{DAV:}getcontenttype']
    if (this.isDir()) {
      type = 'httpd/unix-directory'
    }
    return type
  }

  /**
   * Gets last modified time of file/folder
   * @returns {Date}   Last modified time of file/folder
   */
  getLastModified () {
    return new Date(this.fileInfo['{DAV:}getlastmodified'])
  }

  /**
   * Gets arbitrary property
   * @param   {string} property name of the property
   * @returns {string}          Value of the property
   */
  getProperty (property) {
    return this.fileInfo[property]
  }

  /**
   * Checks whether the information is for a folder
   * @returns {boolean}   true if folder
   */
  isDir () {
    return this.type === 'dir'
  }

  /**
   * Returns TUS support information or null if TUS is not supported on this resource.
   * @returns {Object|null} tus support information or null
   */
  getTusSupport () {
    return this.tusSupport || null
  }
}

module.exports = FileInfo
