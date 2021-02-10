import { MatchersV3, PactV3, XmlBuilder } from '@pact-foundation/pact/v3'

const config = require('./config/config.json')
var adminPasswordHash = Buffer.from(config.adminUsername + ':' + config.adminPassword, 'binary').toString('base64')

const path = require('path')
const OwnCloud = require('../src/owncloud')

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

const uriEncodedTestSubFiles = testSubFiles.map(item => encodeURIComponent(item).split('%2F').join('/'))

/**
 *
 * @param meta {XmlElement}
 * @param status {string}
 * @param statusCode {string}
 * @param Message {string}
 * @returns {string}
 */
const ocsMeta = function (meta, status, statusCode, Message = null) {
  return meta.appendElement('status', '', status)
    .appendElement('statuscode', '', statusCode)
    .appendElement('message', '', Message)
}

const shareResponseOcsData = function (node, shareType, id, permissions, fileTarget) {
  const res = node.appendElement('id', '', id)
    .appendElement('share_type', '', shareType)
    .appendElement('uid_owner', '', config.adminUsername)
    .appendElement('displayname', '', config.adminUsername)
    .appendElement('displayname_owner', '', config.adminUsername)
    .appendElement('permissions', '', permissions)
    .appendElement('uid_file_owner', '', 'admin')
    .appendElement('displayname_file_owner', '', config.adminUsername)
    .appendElement('path', '', fileTarget)
    .appendElement('file_target', '', fileTarget)
    .appendElement('stime', '', Math.floor(Date.now() / 1000))

  if (shareType === 3) {
    res.appendElement('url', '', config.owncloudURL + '/s/yrkoLeS33y1aTya')
  }
  return res
}

const applicationXmlResponseHeaders = {
  'Content-Type': 'application/xml; charset=utf-8'
}
const textPlainResponseHeaders = {
  'Content-Type': 'text/plain; charset=utf-8'
}
const applicationFormUrlEncoded = { 'Content-Type': 'application/x-www-form-urlencoded' }

const xmlResponseHeaders = {
  'Content-Type': 'text/xml; charset=utf-8'
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
      .appendElement('s:exception', '', `Sabre\\DAV\\Exception\\${exception}`)
      .appendElement('s:message', '', message)
  })

const webdavPath = resource => MatchersV3.regex(
  '.*\\/remote\\.php\\/webdav\\/' + webdavMatcherForResource(resource),
  `/remote.php/webdav/${resource}`
)

const createProvider = function () {
  return new PactV3({
    consumer: 'owncloud-sdk',
    provider: 'oc-server',
    port: 1234,
    dir: path.resolve(process.cwd(), 'tests', 'pacts')
  })
}

const createOwncloud = function (username = config.adminUsername, password = config.adminPassword) {
  const oc = new OwnCloud({
    baseUrl: config.owncloudURL,
    auth: {
      basic: {
        username,
        password
      }
    }
  })
  return oc
}

const getContentsOfFileInteraction = (
  provider, file,
  user = config.adminUsername,
  password = config.adminPassword
) => {
  if (user !== config.adminUsername) {
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
    .uponReceiving('GET contents of file ' + file)
    .withRequest({
      method: 'GET',
      path: webdavPath(file),
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
  user = config.adminUsername, password = config.adminPassword
) => {
  let response
  if (user !== config.adminUsername) {
    provider.given('the user is recreated', { username: user, password: password })
  }
  if (resource.includes('nonExistent')) {
    response = {
      status: 404,
      headers: applicationXmlResponseHeaders,
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
          ocsMeta(meta, 'ok', '100')
        }).appendElement('data', '', '')
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
  return provider.uponReceiving(`as '${user}' delete a ${type} called '${resource}'`)
    .withRequest({
      method: 'DELETE',
      path: webdavPath(resource),
      headers: { authorization: getAuthHeaders(user, password) }
    }).willRespondWith(response)
}

async function getCurrentUserInformationInteraction (
  provider, user = config.adminUsername, password = config.adminPassword
) {
  if (user !== config.adminUsername) {
    provider.given('the user is recreated', { username: user, password: password })
  }
  await provider
    .uponReceiving(`as '${user}' get current user information`)
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
      headers: applicationXmlResponseHeaders,
      body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
        ocs.appendElement('meta', '', (meta) => {
          meta.appendElement('status', '', 'ok')
            .appendElement('statuscode', '', '100')
            .appendElement('message', '', 'OK')
        }).appendElement('data', '', (data) => {
          data.appendElement('id', '', user)
          data.appendElement('display-name', '', user)
          data.appendElement('email', '', '')
        })
      })
    })
}

async function getCapabilitiesInteraction (
  provider, user = config.adminUsername, password = config.adminPassword
) {
  if (user !== config.adminUsername) {
    provider.given('the user is recreated', { username: user, password: password })
  }
  await provider
    .uponReceiving(`as '${user}' get capabilities with valid authentication`)
    .withRequest({
      method: 'GET',
      path: MatchersV3.regex(
        /.*\/ocs\/v(1|2)\.php\/cloud\/capabilities/,
        '/ocs/v1.php/cloud/capabilities'
      ),
      query: { format: 'json' },
      headers: { authorization: getAuthHeaders(user, password) }
    })
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
                privateLinks: true,
                privateLinksDetailsParam: true,
                bigfilechunking: true,
                blacklisted_files: [
                  '.htaccess'
                ],
                favorites: true,
                file_locking_support: true,
                file_locking_enable_file_action: false,
                undelete: true,
                versioning: true
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

const getUserInformationAsAdminInteraction = function (provider) {
  return provider.uponReceiving('a single user GET request to the cloud users endpoint')
    .withRequest({
      method: 'GET',
      path: MatchersV3.regex(
        '.*\\/ocs\\/v2\\.php\\/cloud\\/users\\/.+',
        '/ocs/v2.php/cloud/users/' + config.testUser
      ),
      query: { format: 'json' },
      headers: validAdminAuthHeaders
    })
    .willRespondWith({
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: {
        ocs: {
          meta: {
            status: 'ok',
            statuscode: 200,
            message: null
          },
          data: {
            email: 'foo@bar.net'
          }
        }
      }
    })
}

const getCapabilitiesWithInvalidAuthInteraction = function (provider, username = config.adminUsername, password = config.invalidPassword) {
  return provider.uponReceiving(`a capabilities GET request with invalid authentication by ${username} with ${password}`)
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
  provider.uponReceiving('a create user request')
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
      body: `password=${config.testUserPassword}&userid=${config.testUser}`
    }).willRespondWith({
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin
      }
    })
}

const createUserWithGroupMembershipInteraction = function (provider) {
  return provider
    .uponReceiving('a create user request including group membership')
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
      body: 'password=' + config.testUserPassword + '&userid=' + config.testUser + '&groups%5B0%5D=' + config.testGroup
    })
    .willRespondWith({
      status: 200,
      headers: xmlResponseHeaders,
      body: new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', '')
        })
    })
}

const deleteUserInteraction = function (provider) {
  provider.uponReceiving('a request to delete a user')
    .withRequest({
      method: 'DELETE',
      path: MatchersV3.regex(
        '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '$',
        '/ocs/v1.php/cloud/users/' + config.testUser
      ),
      headers: validAdminAuthHeaders
    }).willRespondWith({
      status: 200,
      headers: xmlResponseHeaders,

      body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
        ocs
          .appendElement('meta', '', meta => {
            ocsMeta(meta, 'ok', 100)
          })
          .appendElement('data', '', '')
      })
    })
}

const createFolderInteraction = function (
  provider, folderName, user = config.adminUsername, password = config.adminPassword
) {
  if (user !== config.adminUsername) {
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
  return provider
    .uponReceiving(`create the folder '${folderName}'`)
    .withRequest({
      method: 'MKCOL',
      path: MatchersV3.regex(
        // accept any request to testfolder and any subfolders except notExistentDir
        `.*\\/remote\\.php\\/webdav\\/${folderName}\\/?`,
        '/remote.php/webdav/' + folderName + '/'
      ),
      headers: { authorization: getAuthHeaders(user, password) }
    }).willRespondWith({
      status: 201,
      headers: htmlResponseHeaders
    })
}

const updateFileInteraction = function (provider, file) {
  const etagMatcher = MatchersV3.regex(/^"[a-f0-9:.]{1,32}"$/, config.testFileEtag)
  return provider.uponReceiving('Put file contents to file ' + file)
    .withRequest({
      method: 'PUT',
      path: webdavPath(file),
      headers: {
        ...validAdminAuthHeaders,
        'Content-Type': 'text/plain;charset=utf-8'
      }
      // TODO: uncomment this once the issue is fixed
      // https://github.com/pact-foundation/pact-js/issues/589
      // body: config.testContent
    }).willRespondWith(file.includes('nonExistent') ? {
      status: 404,
      headers: applicationXmlResponseHeaders,
      body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(config.nonExistentDir))
    } : {
      status: 201,
      headers: {
        'OC-FileId': MatchersV3.like(config.testFileOcFileId),
        ETag: etagMatcher,
        'OC-ETag': etagMatcher
      }
    })
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
  uriEncodedTestSubFiles,
  getCapabilitiesInteraction,
  getCurrentUserInformationInteraction,
  getUserInformationAsAdminInteraction,
  createOwncloud,
  createProvider,
  getCapabilitiesWithInvalidAuthInteraction,
  createUserInteraction,
  createUserWithGroupMembershipInteraction,
  deleteUserInteraction,
  createFolderInteraction,
  updateFileInteraction
}
