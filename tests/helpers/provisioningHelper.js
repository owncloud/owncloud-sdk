const ocsHelper = require('./ocsHelper')
const graphHelper = require('./graphHelper')
const { isRunningWithOCIS } = require('../config/env')

exports.createUser = function (
  user,
  password = null,
  email = null,
  displayName = null
) {
  if (isRunningWithOCIS()) {
    return graphHelper.createUser(user, password, email, displayName)
  } else {
    return ocsHelper.createUser(user, password, email, displayName)
  }
}

exports.deleteUser = function (user) {
  if (isRunningWithOCIS()) {
    return graphHelper.deleteUser(user)
  } else {
    return ocsHelper.deleteUser(user)
  }
}

exports.createGroup = function (group) {
  if (isRunningWithOCIS()) {
    return graphHelper.createGroup(group)
  } else {
    return ocsHelper.createGroup(group)
  }
}

exports.deleteGroup = function (group) {
  if (isRunningWithOCIS()) {
    return graphHelper.deleteGroup(group)
  } else {
    return ocsHelper.deleteGroup(group)
  }
}

exports.addToGroup = function (user, group) {
  if (isRunningWithOCIS()) {
    return graphHelper.addToGroup(user, group)
  } else {
    return ocsHelper.addToGroup(user, group)
  }
}

exports.makeUserGroupSubadmin = function (user, group) {
  if (!isRunningWithOCIS()) {
    return ocsHelper.makeUserGroupSubadmin(user, group)
  }
}
