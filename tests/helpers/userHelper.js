const users = require('../config/users.json')

exports.getPasswordForUser = function (username) {
  return users[username].password
}

exports.getDisplayNameForUser = function (username) {
  return users[username].displayname
}

exports.getEmailAddressForUser = function (username) {
  return users[username].email
}
