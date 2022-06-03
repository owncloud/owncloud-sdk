const userHelper = require('./userHelper')
const httpHelper = require('./httpHelper')
const { join } = require('path')

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

async function getGroupId (group) {
  const response = await httpHelper.getGraph('groups/')

  for (const key in response.value) {
    if (response.value[key].displayName.toLowerCase() === group.toLowerCase()) {
      return response.value[key].id
    }
  }
}

async function getUserId (user) {
  const response = await httpHelper.getGraph(`users/${user}`)

  return response.id
}

exports.addToGroup = async function (user, group) {
  const groupId = await getGroupId(group)
  const userId = await getUserId(user)

  const url = join(getProviderBaseUrl(), 'graph/v1.0/users', userId)
  const body = JSON.stringify({
    '@odata.id': url
  })

  return httpHelper.postGraph(`groups/${groupId}/members/$ref`, body)
}
