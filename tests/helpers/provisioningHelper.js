const ocsHelper = require('./ocsHelper')
const graphHelper = require('./graphHelper')
const { isRunningWithOCIS } = require('../config/env')

exports.createUser = function (user) {
  if (isRunningWithOCIS()) {
    return graphHelper.createUser(user)
  } else {
    ocsHelper.createUser(user)
  }
}

exports.deleteUser = function (user) {
  if (isRunningWithOCIS()) {
    return graphHelper.deleteUser(user)
  } else {
    ocsHelper.deleteUser(user)
  }
}

exports.createGroup = function (group) {
  if (isRunningWithOCIS()) {
    return graphHelper.createGroup(group)
  } else {
    ocsHelper.createGroup(group)
  }
}

exports.deleteGroup = function (group) {
  if (isRunningWithOCIS()) {
    return graphHelper.deleteGroup(group)
  } else {
    ocsHelper.deleteGroup(group)
  }
}

exports.addToGroup = function (user, group) {
  if (isRunningWithOCIS()) {
    return graphHelper.addToGroup(user, group)
  } else {
    ocsHelper.addToGroup(user, group)
  }
}

exports.makeUserGroupSubadmin = function (user, group) {
  if (!isRunningWithOCIS()) {
    return ocsHelper.makeUserGroupSubadmin(user, group)
  }
}
