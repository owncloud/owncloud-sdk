const fetch = require('sync-fetch')
const path = require('path')

const {
  validAdminAuthHeaders,
  applicationFormUrlEncoded,
  sanitizeUrl,
  getProviderBaseUrl
} = require('./pactHelper.js')

function createOcsPath (urlPath) {
  return sanitizeUrl(path.join(getProviderBaseUrl(), '/ocs/v1.php', urlPath))
}

const createUser = function (user) {
  return fetch(createOcsPath('/cloud/users'), {
    method: 'POST',
    body: `userid=${user.username}&password=${user.password}&email=${user.email}`,
    headers: {
      ...validAdminAuthHeaders,
      ...applicationFormUrlEncoded
    }
  })
}

const deleteUser = function (username) {
  return fetch(createOcsPath(`/cloud/users/${username}`), {
    method: 'DELETE',
    headers: validAdminAuthHeaders
  })
}

const createGroup = function (groupName) {
  return fetch(createOcsPath('/cloud/groups'), {
    method: 'POST',
    body: 'groupid=' + groupName,
    headers: {
      ...validAdminAuthHeaders,
      ...applicationFormUrlEncoded
    }
  })
}

const deleteGroup = function (groupName) {
  return fetch(createOcsPath(`/cloud/groups/${groupName}`), {
    method: 'DELETE',
    headers: validAdminAuthHeaders
  })
}

const addUserToGroup = function (user, group) {
  return fetch(createOcsPath(`/cloud/users/${user}/groups?format=json`), {
    method: 'POST',
    body: `groupid=${group}`,
    headers: {
      ...validAdminAuthHeaders,
      ...applicationFormUrlEncoded
    }
  })
}

const makeUserGroupSubadmin = function (user, group) {
  return fetch(createOcsPath(`/cloud/users/${user}/subadmins?format=json`), {
    method: 'POST',
    body: `groupid=${group}`,
    headers: {
      ...validAdminAuthHeaders,
      ...applicationFormUrlEncoded
    }
  })
}

module.exports = {
  createUser,
  deleteUser,
  createGroup,
  deleteGroup,
  addUserToGroup,
  makeUserGroupSubadmin
}
