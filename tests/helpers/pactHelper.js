import { MatchersV3, PactV3, XmlBuilder } from '@pact-foundation/pact/v3'

const config = require('../config/config.json')

const {
  admin: { username: adminUsername, password: adminPassword },
  testUser1: { username: testUser, password: testUserPassword }
} = require('../config/users.json')

const adminPasswordHash = Buffer.from(adminUsername + ':' + adminPassword, 'binary').toString('base64')

const path = require('path')
const OwnCloud = require('../../src/owncloud')

const accessControlAllowHeaders = 'OC-Checksum,OC-Total-Length,OCS-APIREQUEST,X-OC-Mtime,Accept,Authorization,Brief,Content-Length,Content-Range,Content-Type,Date,Depth,Destination,Host,If,If-Match,If-Modified-Since,If-None-Match,If-Range,If-Unmodified-Since,Location,Lock-Token,Overwrite,Prefer,Range,Schedule-Reply,Timeout,User-Agent,X-Expected-Entity-Length,Accept-Language,Access-Control-Request-Method,Access-Control-Allow-Origin,ETag,OC-Autorename,OC-CalDav-Import,OC-Chunked,OC-Etag,OC-FileId,OC-LazyOps,OC-Total-File-Length,Origin,X-Request-ID,X-Requested-With'
const accessControlAllowMethods = 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT,COPY,MOVE,HEAD,LOCK,UNLOCK'
const origin = 'http://localhost:9876'
const validAdminAuthHeaders = {
  authorization: 'Basic ' + adminPasswordHash
}

const testSubFiles = [
  `${config.testFolder}/abc.txt`,
  `${config.testFolder}/file one.txt`,
  `${config.testFolder}/subdir/in dir.txt`,
  `${config.testFolder}/zz+z.txt`,
  `${config.testFolder}/中文.txt`
]

const encodeURIPath = function (path) {
  return encodeURIComponent(path).split('%2F').join('/')
}

const getMatchers = function (element) {
  if (typeof element === 'string' || typeof element === 'number') {
    return MatchersV3.equal(element)
  } else {
    return element
  }
}
/**
 *
 * @param meta {XmlElement}
 * @param status {string}
 * @param statusCode {string}
 * @param Message {string}
 * @returns {string}
 */
const ocsMeta = function (meta, status, statusCode, Message = null) {
  return meta.appendElement('status', '', getMatchers(status))
    .appendElement('statuscode', '', getMatchers(statusCode))
    .appendElement('message', '', getMatchers(Message))
}

const shareResponseOcsData = function (node, shareType, id, permissions, fileTarget) {
  const res = node.appendElement('id', '', MatchersV3.string(id))
    .appendElement('share_type', '', MatchersV3.equal(shareType.toString()))
    .appendElement('uid_owner', '', MatchersV3.string(adminUsername))
    .appendElement('displayname_owner', '', MatchersV3.string(adminUsername))
    .appendElement('permissions', '', MatchersV3.number(permissions))
    .appendElement('uid_file_owner', '', MatchersV3.string(adminUsername))
    .appendElement('displayname_file_owner', '', MatchersV3.string(adminUsername))
    .appendElement('path', '', MatchersV3.equal(fileTarget))
    .appendElement('file_target', '', MatchersV3.includes(fileTarget))
    .appendElement('stime', '', MatchersV3.string(Math.floor(Date.now() / 1000)))

  if (shareType === 3) {
    res.appendElement('url', '', MatchersV3.regex(
      '.*\\/s\\/[a-zA-Z0-9]+',
      getMockServerBaseUrl() + 's/yrkoLeS33y1aTya'))
  }
  return res
}

const applicationXmlResponseHeaders = {
  'Content-Type': 'application/xml; charset=utf-8'
}
const textPlainResponseHeaders = {
  'Content-Type': MatchersV3.regex('text/plain(;()?charset=(utf|UTF)-8)?', 'text/plain; charset=utf-8')
}
const applicationFormUrlEncoded = { 'Content-Type': 'application/x-www-form-urlencoded' }

const xmlResponseHeaders = {
  'Content-Type': MatchersV3.regex(
    /(application|text)\/xml; charset=(utf|UTF)-8/, 'text/xml; charset=utf-8'
  )
}

const htmlResponseHeaders = {
  'Content-Type': 'text/html; charset=utf-8'
}

const getAuthHeaders = (username, password) => {
  const header = `${username}:${password}`
  const buff = Buffer.from(header)
  return 'Basic ' + buff.toString('base64')
}

const invalidAuthHeader = 'Basic YWRtaW46bm90QVZhbGlkUGFzc3dvcmQ='

const unauthorizedXmlResponseBody = new XmlBuilder('1.0', '', 'ocs').build(ocs => {
  ocs.appendElement('meta', '', (meta) => {
    return ocsMeta(meta, 'failure', '997', 'Unauthorised')
  })
    .appendElement('data', '', '')
})

const resourceNotFoundExceptionMessage = resource => `File with name ${resource} could not be located`

const webdavMatcherForResource = resource => {
  if (resource === '/') {
    return ''
  }
  if (resource.includes('/')) {
    return resource.split('/').join('\\/') + '$'
  } else {
    return resource + '$'
  }
}
const webdavExceptionResponseBody = (exception, message) => new XmlBuilder('1.0', 'utf-8', 'd:error')
  .build(dError => {
    dError.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:s': 'http://sabredav.org/ns' })
    dError
      .appendElement('s:exception', '', MatchersV3.equal(`Sabre\\DAV\\Exception\\${exception}`))
      .appendElement('s:message', '', MatchersV3.equal(message))
  })

const webdavPath = (resource, username) => {
  resource = encodeURIPath(resource)
  return MatchersV3.regex(
    `.*\\/remote\\.php\\/dav\\/files\\/${username}\\/` + webdavMatcherForResource(resource),
    path.join(`/remote.php/dav/files/${username}`, resource)
  )
}

const createProvider = function (pendingOnOc10 = false, pendingOnOcis = false) {
  let providerNameSuffix = ''
  if (pendingOnOc10 || pendingOnOcis) {
    providerNameSuffix += '-pendingOn'
  }
  if (pendingOnOc10) {
    providerNameSuffix += '-oc10'
  }
  if (pendingOnOcis) {
    providerNameSuffix += '-ocis'
  }
  return new PactV3({
    consumer: 'owncloud-sdk',
    provider: 'oc-server' + providerNameSuffix,
    port: config.pactMockPort,
    dir: path.resolve(process.cwd(), 'tests', 'pacts')
  })
}

const sanitizeUrl = (url) => {
  return url.replace(/([^:])\/{2,}/g, '$1/')
}

const createOwncloud = function (username = adminUsername, password = adminPassword) {
  const oc = new OwnCloud({
    baseUrl: getMockServerBaseUrl(),
    auth: {
      basic: {
        username,
        password
      }
    }
  })
  return oc
}
// [OCIS] Trying to access a non-existing resource returns an empty body
// https://github.com/owncloud/ocis/issues/1282
const getContentsOfFileInteraction = (
  provider, file,
  user = adminUsername,
  password = adminPassword
) => {
  if (user !== adminUsername) {
    provider.given('the user is recreated', { username: user, password: password })
  }
  if (file !== config.nonExistentFile) {
    provider
      .given('file exists', {
        fileName: file,
        username: user,
        password: password
      })
  }
  return provider
    .uponReceiving(`as '${user}', a GET request to get contents of a file '${file}'`)
    .withRequest({
      method: 'GET',
      path: webdavPath(file, user),
      headers: { authorization: getAuthHeaders(user, password) }
    }).willRespondWith(file !== config.nonExistentFile ? {
      status: 200,
      headers: textPlainResponseHeaders,
      body: config.testContent
    } : {
      status: 404,
      headers: applicationXmlResponseHeaders,
      body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(config.nonExistentFile))
    })
}

const deleteResourceInteraction = (
  provider, resource, type = 'folder',
  user = adminUsername, password = adminPassword
) => {
  let response
  if (user !== adminUsername) {
    provider.given('the user is recreated', { username: user, password: password })
  }
  if (resource.includes('nonExistent')) {
    response = {
      status: 404,
      headers: xmlResponseHeaders,
      body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(config.nonExistentDir))
    }
  } else if (type === 'file') {
    provider.given('file exists', {
      fileName: resource,
      username: user,
      password: password
    })
    response = {
      status: 200,
      headers: xmlResponseHeaders,
      body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
        ocs.appendElement('meta', '', (meta) => {
          ocsMeta(meta, 'ok', MatchersV3.equal('100'))
        }).appendElement('data', '', MatchersV3.equal(''))
      })
    }
  } else {
    provider.given('folder exists', {
      folderName: resource,
      username: user,
      password: password
    })
    response = {
      status: 204
    }
  }
  return provider.uponReceiving(`as '${user}', a DELETE request to delete a ${type} '${resource}'`)
    .withRequest({
      method: 'DELETE',
      path: webdavPath(resource, user),
      headers: { authorization: getAuthHeaders(user, password) }
    }).willRespondWith(response)
}

async function getCurrentUserInformationInteraction (
  provider, user = adminUsername, password = adminPassword
) {
  const displayName = user[0].toUpperCase() + user.slice(1)
  if (user !== adminUsername) {
    provider.given('the user is recreated', { username: user, password: password })
  }
  await provider
    .uponReceiving(`as '${user}', a GET to get current user information`)
    .withRequest({
      method: 'GET',
      path: MatchersV3.regex(
        /.*\/ocs\/v1\.php\/cloud\/user$/,
        '/ocs/v1.php/cloud/user'
      ),
      headers: { authorization: getAuthHeaders(user, password) }
    })
    .willRespondWith({
      status: 200,
      headers: xmlResponseHeaders,
      body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
        ocs.appendElement('meta', '', (meta) => {
          meta.appendElement('status', '', MatchersV3.equal('ok'))
            .appendElement('statuscode', '', MatchersV3.equal('100'))
            .appendElement('message', '', MatchersV3.equal('OK'))
        }).appendElement('data', '', (data) => {
          data.appendElement('id', '', MatchersV3.equal(user))
          data.appendElement('display-name', '', MatchersV3.regex(`(${user}|${displayName})`, user))
          data.appendElement('email', '', MatchersV3.regex(`(${user}@example\\..*)?`, ''))
        })
      })
    })
}

async function getCapabilitiesInteraction (
  provider, user = adminUsername, password = adminPassword
) {
  if (user !== adminUsername) {
    provider.given('the user is recreated', { username: user, password: password })
  }
  await provider
    .uponReceiving(`as '${user}', a GET request to get capabilities with valid authentication`)
    .withRequest({
      method: 'GET',
      path: MatchersV3.regex(
        /.*\/ocs\/v(1|2)\.php\/cloud\/capabilities/,
        '/ocs/v1.php/cloud/capabilities'
      ),
      query: { format: 'json' },
      headers: { authorization: getAuthHeaders(user, password) }
    })
    /*
      [oCIS] ocis returns `text/plain` content-type not `application/json`
      when requesting with `?format=json`
      https://github.com/owncloud/ocis/issues/1779
    */
    .willRespondWith({
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: {
        ocs: {
          meta: {
            status: 'ok',
            statuscode: 100,
            message: 'OK'
          },
          data: {
            version: {
              major: MatchersV3.integer(10),
              minor: MatchersV3.integer(5),
              micro: MatchersV3.integer(1),
              string: MatchersV3.string('10.5.1alpha1'),
              edition: MatchersV3.string('Enterprise')
            },
            capabilities: {
              files: {
                privateLinks: MatchersV3.boolean(true),
                bigfilechunking: MatchersV3.boolean(true),
                favorites: MatchersV3.boolean(true),
                undelete: MatchersV3.boolean(true),
                versioning: MatchersV3.boolean(true)
              },
              dav: {
                trashbin: '1.0'
              }
            }
          }
        }
      }
    })
}

// [OCIS] HTTP 401 Unauthorized responses don't contain a body
// https://github.com/owncloud/ocis/issues/1293
const getCapabilitiesWithInvalidAuthInteraction = function (provider, username = adminUsername, password = config.invalidPassword) {
  return provider.uponReceiving(`as '${username}', a GET request to get capabilities with invalid auth`)
    .withRequest({
      method: 'GET',
      path: MatchersV3.regex(
        '.*\\/ocs\\/v1\\.php\\/cloud\\/capabilities',
        '/ocs/v1.php/cloud/capabilities'
      ),
      query: { format: 'json' },
      headers: {
        authorization: getAuthHeaders(username, password)
      }
    }).willRespondWith({
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: {
        ocs: {
          meta: {
            status: 'failure',
            statuscode: 997,
            message: 'Unauthorised'
          }
        }
      }
    })
}

const createUserInteraction = function (provider) {
  provider.uponReceiving(`as '${adminUsername}', a POST request to create a user`)
    .withRequest({
      method: 'POST',
      path: MatchersV3.regex(
        '.*\\/ocs\\/v1\\.php\\/cloud\\/users',
        '/ocs/v1.php/cloud/users'
      ),
      headers: {
        ...validAdminAuthHeaders,
        ...applicationFormUrlEncoded
      },
      body: `password=${testUserPassword}&userid=${testUser}`
    }).willRespondWith({
      status: 200,
      headers: xmlResponseHeaders
    })
}

const createUserWithGroupMembershipInteraction = function (provider) {
  return provider
    .given('group exists', { groupName: config.testGroup })
    .uponReceiving(`as '${adminUsername}', a POST request to create a user with group membership`)
    .withRequest({
      method: 'POST',
      path: MatchersV3.regex(
        '.*\\/ocs\\/v1\\.php\\/cloud\\/users',
        '/ocs/v1.php/cloud/users'
      ),
      headers: {
        ...validAdminAuthHeaders,
        ...applicationFormUrlEncoded
      },
      body: 'password=' + testUserPassword + '&userid=' + testUser + '&groups%5B0%5D=' + config.testGroup
    })
    .willRespondWith({
      status: 200,
      headers: xmlResponseHeaders,
      body: new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', MatchersV3.equal(''))
        })
    })
}

const deleteUserInteraction = function (provider) {
  provider.uponReceiving(`as '${adminUsername}', a DELETE request to delete a user`)
    .withRequest({
      method: 'DELETE',
      path: MatchersV3.regex(
        '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + testUser + '$',
        '/ocs/v1.php/cloud/users/' + testUser
      ),
      headers: validAdminAuthHeaders
    }).willRespondWith({
      status: 200,
      headers: xmlResponseHeaders,

      body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
        ocs
          .appendElement('meta', '', meta => {
            ocsMeta(meta, 'ok', 100, MatchersV3.regex('(OK)?', ''))
          })
          .appendElement('data', '', '')
      })
    })
}

const createFolderInteraction = function (
  provider, folderName, user = adminUsername, password = adminPassword
) {
  if (user !== adminUsername) {
    provider.given('the user is recreated', { username: user, password: password })
  }

  // if a subfolder is to be created the higher level folder needs to be created in the provider state
  const folders = folderName.split(path.sep)
  let recrusivePath = ''
  for (let i = 0; i < folders.length - 1; i++) {
    recrusivePath += path.sep + folders[i]
  }
  if (recrusivePath !== '') {
    provider.given('folder exists', {
      folderName: recrusivePath,
      username: user,
      password: password
    })
  }
  const encodedFolderName = encodeURIPath(folderName)
  return provider
    .uponReceiving(`as '${user}', a MKCOL request to create a folder '${folderName}'`)
    .withRequest({
      method: 'MKCOL',
      path: MatchersV3.regex(
        // accept any request to testfolder and any subfolders except notExistentDir
        `.*\\/remote\\.php\\/dav\\/files\\/${user}\\/${encodedFolderName}\\/?`,
        `/remote.php/dav/files/${user}/${encodedFolderName}/`
      ),
      headers: { authorization: getAuthHeaders(user, password) }
    }).willRespondWith({
      status: 201
    })
}

const updateFileInteraction = function (provider, file, user = adminUsername, password = adminPassword
) {
  if (user !== adminUsername) {
    provider.given('the user is recreated', { username: user, password: password })
  }
  if (!file.includes('nonExistent')) {
    provider.given('folder exists', {
      folderName: path.dirname(file),
      username: user,
      password: password
    })
  }

  const etagMatcher = MatchersV3.regex(/^"[a-f0-9:.]{1,32}"$/, config.testFileEtag)
  let response = {}
  if (file.includes(config.nonExistentDir)) {
    response = {
      status: 409,
      headers: applicationXmlResponseHeaders,
      body: webdavExceptionResponseBody(
        'Conflict',
        'Files cannot be created in non-existent collections'
      )
    }
  } else if (file.includes(config.nonExistentFile)) {
    response = {
      status: 404,
      headers: applicationXmlResponseHeaders,
      body: webdavExceptionResponseBody(
        'NotFound',
        resourceNotFoundExceptionMessage(config.nonExistentDir)
      )
    }
  } else {
    response = {
      status: 201,
      headers: {
        'OC-FileId': MatchersV3.like(config.testFileOcFileId),
        ETag: etagMatcher,
        'OC-ETag': etagMatcher
      }
    }
  }
  return provider.uponReceiving(`as '${user}', a PUT request to upload a file to '${file}'`)
    .withRequest({
      method: 'PUT',
      path: webdavPath(file, user),
      headers: {
        authorization: getAuthHeaders(user, password),
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: config.testContent
    })
    .willRespondWith(response)
}

const getProviderBaseUrl = function () {
  let providerBaseUrl = process.env.PROVIDER_BASE_URL || 'http://localhost/'
  providerBaseUrl = providerBaseUrl.replace(/\/$/, '')
  return providerBaseUrl
}

const getMockServerBaseUrl = function () {
  const subfolder = process.env.SUBFOLDER || '/'
  return `${config.pactMockHost}:${config.pactMockPort}${subfolder}`
}

module.exports = {
  getAuthHeaders,
  getContentsOfFileInteraction,
  deleteResourceInteraction,
  ocsMeta,
  shareResponseOcsData,
  webdavMatcherForResource,
  webdavExceptionResponseBody,
  resourceNotFoundExceptionMessage,
  webdavPath,
  origin,
  validAdminAuthHeaders,
  invalidAuthHeader,
  xmlResponseHeaders,
  htmlResponseHeaders,
  applicationFormUrlEncoded,
  textPlainResponseHeaders,
  accessControlAllowHeaders,
  accessControlAllowMethods,
  unauthorizedXmlResponseBody,
  applicationXmlResponseHeaders,
  testSubFiles,
  getCapabilitiesInteraction,
  getCurrentUserInformationInteraction,
  createOwncloud,
  createProvider,
  getCapabilitiesWithInvalidAuthInteraction,
  createUserInteraction,
  createUserWithGroupMembershipInteraction,
  deleteUserInteraction,
  createFolderInteraction,
  updateFileInteraction,
  sanitizeUrl,
  getProviderBaseUrl,
  getMockServerBaseUrl,
  encodeURIPath
}
