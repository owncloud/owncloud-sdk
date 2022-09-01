const userHelper = require('./userHelper')
const httpHelper = require('./httpHelper')

const { applicationFormUrlEncodedContentType } = require('./pactHelper.js')

exports.createUser = function (
  user,
  password = null,
  email = null,
  displayName = null
) {
  password = password || userHelper.getPasswordForUser(user)
  email = email || userHelper.getEmailAddressForUser(user)
  displayName = displayName || userHelper.getDisplayNameForUser(user)

  return httpHelper.postOCS(
    '/cloud/users',
    `userid=${user}&password=${password}&email=${email}`,
    applicationFormUrlEncodedContentType
  )
}

exports.deleteUser = function (user) {
  return httpHelper.deleteOCS(`/cloud/users/${user}`)
}

exports.createGroup = function (group) {
  return httpHelper.postOCS(
    '/cloud/groups',
    `groupid=${group}`,
    applicationFormUrlEncodedContentType
  )
}

exports.deleteGroup = function (group) {
  return httpHelper.deleteOCS(`/cloud/groups/${group}`)
}

exports.addToGroup = function (user, group) {
  return httpHelper.postOCS(
    `/cloud/users/${user}/groups`,
    `groupid=${group}`,
    applicationFormUrlEncodedContentType
  )
}

exports.makeUserGroupSubadmin = function (user, group) {
  return httpHelper.postOCS(
    `/cloud/users/${user}/subadmins`,
    `groupid=${group}`,
    applicationFormUrlEncodedContentType
  )
}
