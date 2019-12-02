
class FileTrashbin {
  constructor () {
    this._name = '' // {http://owncloud.org/ns}trashbin-original-filename
    this._basePath = ''
    this._originalLocation = '' // '{http://owncloud.org/ns}trashbin-original-location'
    this._type = '' // dir-file
    this._extension = ''
    this._deletionTimestamp = '' // {http://owncloud.org/ns}trashbin-delete-datetime
  }

  // getType () {
  //   return this.type
  // }

  // isDir () {
  //   return this.type === 'dir'
  // }

  // getExtension () {
  //   return this.extension
  // }

  // getDeletionTimestamp () {
  //   return this.deletionTimestamp
  // }

  // getOriginalLocation () {
  //   return this.originalLocation
  // }
}

module.export = FileTrashbin
