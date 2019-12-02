class User {
  constructor (uid, name) {
    this._uid = uid
    this._name = name
  }

  get uid () {
    return this._uid
  }

  get name () {
    return this._name
  }
}

module.exports = User
