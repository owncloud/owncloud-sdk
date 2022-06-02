const httpHelper = require('./httpHelper')

const { applicationFormUrlEncoded } = require('./pactHelper.js')

exports.createUser = function (user) {
  return httpHelper.postOCS(
    '/cloud/users',
    `userid=${user.username}&password=${user.password}&email=${user.email}`,
    applicationFormUrlEncoded
  )
}

exports.deleteUser = function (username) {
  return httpHelper.deleteOCS(`/cloud/users/${username}`)
}

exports.createGroup = function (groupName) {
  return httpHelper.postOCS(
    '/cloud/groups',
    `groupid=${groupName}`,
    applicationFormUrlEncoded
  )
}

exports.deleteGroup = function (groupName) {
  return httpHelper.deleteOCS(`/cloud/groups/${groupName}`)
}

exports.addToGroup = function (user, group) {
  return httpHelper.postOCS(
    `/cloud/users/${user}/groups`,
    `groupid=${group}`,
    applicationFormUrlEncoded
  )
}

exports.makeUserGroupSubadmin = function (user, group) {
  return httpHelper.postOCS(
    `/cloud/users/${user}/subadmins`,
    `groupid=${group}`,
    applicationFormUrlEncoded
  )
}
