const { join } = require('path')
const { parseResponseBody } = require('./ocsResponseParser')
const userHelper = require('./userHelper')
const httpHelper = require('./httpHelper')

const { getProviderBaseUrl } = require('./pactHelper.js')

exports.createUser = function (
  user,
  password = null,
  email = null,
  displayName = null
) {
  email = email || userHelper.getEmailAddressForUser(user)
  password = password || userHelper.getPasswordForUser(user)
  displayName = displayName || userHelper.getDisplayNameForUser(user)

  const body = JSON.stringify({
    displayName,
    mail: email,
    onPremisesSamAccountName: user,
    passwordProfile: { password }
  })
  return httpHelper.postGraph('users', body)
}

exports.deleteUser = function (user) {
  return httpHelper.deleteGraph(`users/${user}`)
}

exports.createGroup = function (group) {
  const body = JSON.stringify({ displayName: group })
  return httpHelper.postGraph('groups', body)
}

exports.deleteGroup = async function (group) {
  // deleting group does not work with the groupname. so we find groupId
  const groupId = await getGroupId(group)
  return httpHelper.deleteGraph(`groups/${groupId}`)
}

function getGroupId (group) {
  const response = httpHelper.getGraph('groups/')
  const resObj = parseResponseBody(response)

  for (const key in resObj.value) {
    if (resObj.value[key].displayName.toLowerCase() === group.toLowerCase()) {
      return resObj.value[key].id
    }
  }
}

function getUserId (user) {
  const response = httpHelper.getGraph(`users/${user}`)
  const resObj = parseResponseBody(response)

  return resObj.id
}

exports.addToGroup = function (user, group) {
  const groupId = getGroupId(group)
  const userId = getUserId(user)

  const url = join(getProviderBaseUrl(), 'graph/v1.0/users', userId)
  const body = JSON.stringify({
    '@odata.id': url
  })

  return httpHelper.postGraph(`groups/${groupId}/members/$ref`, body)
}
