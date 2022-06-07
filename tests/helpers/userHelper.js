/** TODO:
 Refactor this to use separate user config.json
 and remove users from config.json
*/
const config = require('../config/config.json')

const users = {
  admin: {
    username: config.adminUsername,
    password: config.adminPassword,
    displayname: config.adminDisplayName,
    email: 'admin@example.com'
  },
  [config.testUser]: {
    username: config.testUser,
    password: config.testUserPassword,
    displayname: config.testUser,
    email: `${config.testUser}@example.com`
  },
  [config.testUser2]: {
    username: config.testUser2,
    password: config.testUser2Password,
    displayname: config.testUser2,
    email: `${config.testUser2}@example.com`
  }
}

exports.getPasswordForUser = function (username) {
  return users[username].password
}

exports.getDisplayNameForUser = function (username) {
  return users[username].displayname
}

exports.getEmailAddressForUser = function (username) {
  return users[username].email
}
