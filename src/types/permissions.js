// TODO change the internal representation of permissions
class Permissions {
  constructor (permissions, type) {
    this._permissions = permissions
    this._type = type// TODO remove this
  }

  get canUpload () {
    return this._permissions.indexOf('C') >= 0
  }

  get canDownload () {
    return this._type !== 'folder'
  }

  get canBeDeleted () {
    return this._permissions.indexOf('D') >= 0
  }

  get canRename () {
    return this._permissions.indexOf('N') >= 0
  }

  get canShare () {
    return this._permissions.indexOf('R') >= 0
  }

  get isMounted () {
    return this._permissions.indexOf('M') >= 0
  }
}

module.exports = Permissions
