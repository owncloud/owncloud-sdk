const fetch = require('sync-fetch')
const { join } = require('path')

const userHelper = require('./userHelper')
const { getProviderBaseUrl, getAuthHeaders } = require('./pactHelper.js')

const createAuthHeader = function (userId) {
  return {
    Authorization: getAuthHeaders(userId, userHelper.getPasswordForUser(userId))
  }
}

const requestEndpoint = function (path, params, userId = 'admin', header = {}) {
  let headers = { ...createAuthHeader(userId), ...header }
  // do not add default auth header for public-files paths
  if (path.includes('public-files')) {
    headers = { ...header }
  }
  const options = { ...params, headers }
  const url = join(getProviderBaseUrl(), 'remote.php/dav', path)
  return fetch(url, options)
}

const requestOCSEndpoint = function (
  path,
  params,
  userId = 'admin',
  header = {}
) {
  const headers = { ...createAuthHeader(userId), ...header }
  const options = { ...params, headers }
  const separator = path.includes('?') ? '&' : '?'
  const url = join(
    getProviderBaseUrl(),
    'ocs/v2.php',
    path + separator + 'format=json'
  )
  return fetch(url, options)
}

const requestGraphEndpoint = function (
  path,
  params,
  userId = 'admin',
  header = {}
) {
  const headers = { ...createAuthHeader(userId), ...header }
  const options = { ...params, headers }
  const url = join(getProviderBaseUrl(), 'graph/v1.0', path)
  return fetch(url, options)
}

module.exports = {
  // ocs request methods
  getOCS: (url, body, header, userId) =>
    requestOCSEndpoint(url, { body, method: 'GET' }, userId, header),
  putOCS: (url, body, header, userId) =>
    requestOCSEndpoint(url, { body, method: 'PUT' }, userId, header),
  postOCS: (url, body, header, userId) =>
    requestOCSEndpoint(url, { body, method: 'POST' }, userId, header),
  deleteOCS: (url, body, header, userId) =>
    requestOCSEndpoint(url, { body, method: 'DELETE' }, userId, header),
  // dav request methods
  get: (url, body, header, userId) =>
    requestEndpoint(url, { body, method: 'GET' }, userId, header),
  post: (url, body, header, userId) =>
    requestEndpoint(url, { body, method: 'POST' }, userId, header),
  put: (url, body, header, userId) =>
    requestEndpoint(url, { body, method: 'PUT' }, userId, header),
  delete: (url, body, header, userId) =>
    requestEndpoint(url, { body, method: 'DELETE' }, userId, header),
  move: (url, body, header, userId) =>
    requestEndpoint(url, { body, method: 'MOVE' }, userId, header),
  mkcol: (url, body, header, userId) =>
    requestEndpoint(url, { body, method: 'MKCOL' }, userId, header),
  propfind: (url, body, header, userId) =>
    requestEndpoint(url, { body, method: 'PROPFIND' }, userId, header),
  proppatch: (url, body, header, userId) =>
    requestEndpoint(url, { body, method: 'PROPPATCH' }, userId, header),
  // graph Api requests
  postGraph: (url, body, header, userId) =>
    requestGraphEndpoint(url, { body, method: 'POST' }, userId, header),
  deleteGraph: (url, body, header, userId) =>
    requestGraphEndpoint(url, { body, method: 'DELETE' }, userId, header),
  getGraph: (url, body, header, userId) =>
    requestGraphEndpoint(url, { body, method: 'GET' }, userId, header)
}
