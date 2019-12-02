// TODO add owner

/**
 * @class File
 * @classdesc File class, stores information regarding a file/folder
 * @param   {string}    name     name of file/folder
 * @param   {string}    type     "file" => file ; "dir" => folder
 * @param   {string}    attr     attributes of file like size, time added etc.
 */
class File {
  /**
   * Gets the file id
   * @returns {string}    file id
   */
  get id () {
    return this._id
  }

  set id (id) {
    this._id = id
  }

  get type () {
    return this._type
  }

  set type (type) {
    this._type = type
  }

  /**
   * Gets the name of file/folder
   * @returns {string}    name of file/folder
   */
  get name () {
    if (this._name) {
      return '/' + this._name
    }
    return ''
  }

  get baseName () {
    if (this._name && this.extension) {
      return this._name.substring(0, this._name.length - this.extension.length - 1)
    }
    return this._name || ''
  }

  /**
   * Gets path of file/folder
   * @returns {string}    Path of file/folder
   */
  get basePath () {
    if (this._basePath !== '') {
      return '/' + this._basePath
    }
    return ''
  }

  get fullPath () {
    return this._fullPath
  }

  set fullPath (fullPath) {
    this._fullPath = fullPath

    let pathArray = fullPath.split('/').filter((elem) => elem.length !== 0)
    this._name = pathArray.pop()
    this._basePath = pathArray.join('/')
  }

  /**
   * Gets size of the file/folder
   * @returns {number}   Size of file/folder
   */
  get size () {
    return this._size
  }

  set size (size) {
    this._size = parseInt(size)
  }

  /**
   * Gets ETag of file/folder
   * @returns {string}    ETag of file/folder
   */
  get eTag () {
    return this._eTag
  }

  set eTag (eTag) {
    this._eTag = eTag
  }

  /**
   * Gets content-type of file/folder
   * @returns {string}    content-type of file/folder
   */
  get mimeType () {
    return this._mimeType
  }

  set mimeType (mimeType) {
    this._mimeType = mimeType
  }

  /**
   * Gets last modified time of file/folder
   * @returns {Date}   Last modified time of file/folder
   */
  get lastModified () {
    return this._lastModified
  }

  set lastModified (lastModified) {
    this._lastModified = new Date(lastModified)
  }

  /**
   * Checks whether the information is for a folder
   * @returns {boolean}   true if folder
   */
  get isDir () {
    return this._type === 'dir'
  }

  get permissions () {
    return this._permissions
  }

  set permissions (permissions) {
    this._permissions = permissions
  }

  get extension () {
    if (!this.isDir && this._name) {
      return this._name.split('.').pop()
    }
    return ''
  }

  get metadata () {
    return this._metadata
  }

  set metadata (metadata) {
    this._metadata = metadata
  }

  get isStarred () {
    // TODO check inside metadata
    return false
  }

  get owner () {
    return this._owner
  }

  set owner (owner) {
    this._owner = owner
  }
}

// /*
//   This extra proxy class allows us to avoid difficult to debug errors by restricting the
//   values that can be read and written in File.
//  */
// class FilesExport extends Proxy {
//   constructor () {
//     super(new File(), {
//       get (target, key) {
//         if (key in target) {
//           return target[key]
//         }
//         throw new Error('Getter "' + name + '" not found in "File"')
//       },
//       set (target, key) {
//         if (key in target) {
//           return target[key]
//         }
//         throw new Error('Setter "' + name + '" not found in "File"')
//       }
//     })
//   }
// }
// module.exports = FilesExport
module.exports = File
