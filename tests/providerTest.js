const config = require('./config/config.json')
const { getOCSMeta, getOCSData } = require('./helpers/ocsResponseParser')

let lastSharedToken = ''
const crypto = require('crypto')

describe('provider testing', () => {
  const { VerifierV3 } = require('@pact-foundation/pact/v3')
  const chai = require('chai')
  const chaiAsPromised = require('chai-as-promised')
  const path = require('path')
  const fetch = require('sync-fetch')
  const { parseString } = require('xml2js')

  const {
    validAdminAuthHeaders,
    applicationFormUrlEncoded,
    getAuthHeaders,
    sanitizeUrl
  } = require('./pactHelper.js')

  const {
    createFolderRecrusive,
    createFile,
    getFileId,
    listVersionsFolder,
    getSignKey
  } = require('./webdavHelper.js')

  const {
    shareResource,
    getShareInfoByPath,
    createFolderInLastPublicShare,
    createFileInLastPublicShare
  } = require('./helpers/sharingHelper.js')

  chai.use(chaiAsPromised)

  const providerBaseUrl = process.env.PROVIDER_BASE_URL || 'http://localhost/'

  const assertFoldersCreatedSuccessfully = function (results, folderName) {
    for (let i = 0; i < results.length; i++) {
      // 405 means that the folder already exists
      if (results[i].status !== 405) {
        chai.assert.isBelow(
          results[i].status, 300, `creating folder '${folderName}' failed`
        )
      }
    }
  }

  /**
   * Create a hashed key with secretKey from the string
   * @param {string} stringToHash - The string that will be hashed.
   * @param {string} algorithm - Hashing algorithm.
   * @param {string} secretKey - Secret string.
   * @param {number} iterations - Number of iterations.
   * @returns {string} Ready hashed key.
   */
  const createHashedKey = function (stringToHash, algorithm, secretKey, iterations) {
    const hashedKey = crypto.pbkdf2Sync(
      stringToHash,
      secretKey,
      iterations,
      32,
      algorithm
    )
    return hashedKey.toString('hex')
  }

  it('verifies the provider', () => {
    const opts = {
      provider: 'oc-server',
      providerBaseUrl,
      disableSSLVerification: true,
      callbackTimeout: 10000
    }
    if (process.env.CI === 'true') {
      opts.pactBrokerUrl = 'https://jankaritech.pactflow.io'
      opts.publishVerificationResult = true
      opts.pactBrokerToken = process.env.PACTFLOW_TOKEN
      opts.enablePending = true
      opts.consumerVersionTags = process.env.DRONE_SOURCE_BRANCH
      opts.providerVersion = process.env.PROVIDER_VERSION
    } else {
      opts.pactUrls = [path.resolve(process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server.json')]
    }

    opts.stateHandlers = {
      'group exists': (setup, parameters) => {
        if (setup) {
          fetch(providerBaseUrl + '/ocs/v1.php/cloud/groups', {
            method: 'POST',
            body: 'groupid=' + parameters.groupName,
            headers: {
              ...validAdminAuthHeaders,
              ...applicationFormUrlEncoded
            }
          })
          return { description: 'group added' }
        } else {
          fetch(providerBaseUrl + '/ocs/v1.php/cloud/groups/' + parameters.groupName, {
            method: 'DELETE',
            headers: validAdminAuthHeaders
          })
          return { description: 'group deleted' }
        }
      },
      'group does not exist': (setup, parameters) => {
        fetch(providerBaseUrl + '/ocs/v1.php/cloud/groups/' + parameters.groupName, {
          method: 'DELETE',
          headers: validAdminAuthHeaders
        })
        return { description: 'group deleted' }
      },
      'folder exists': (setup, parameters) => {
        if (setup) {
          const results = createFolderRecrusive(
            parameters.username, parameters.password, parameters.folderName
          )
          assertFoldersCreatedSuccessfully(results, parameters.folderName)
        }
        return { description: 'folder created' }
      },
      'file exists': (setup, parameters) => {
        const dirname = path.dirname(parameters.fileName)
        if (setup) {
          if (dirname !== '' && dirname !== '/' && dirname !== '.') {
            const results = createFolderRecrusive(
              parameters.username, parameters.password, dirname
            )
            assertFoldersCreatedSuccessfully(results, dirname)
          }
          const result = createFile(
            parameters.username, parameters.password, parameters.fileName, config.testContent
          )
          chai.assert.isBelow(
            result.status, 300, `creating file '${parameters.fileName}' failed`
          )
          return { fileId: result.headers.get('oc-fileid') }
        }
      },
      'the user is recreated': (setup, parameters) => {
        const email = `${parameters.username}@example.com`
        if (setup) {
          fetch(providerBaseUrl + '/ocs/v2.php/cloud/users/' + parameters.username, {
            method: 'DELETE',
            headers: validAdminAuthHeaders
          })
          const result = fetch(providerBaseUrl + '/ocs/v2.php/cloud/users',
            {
              method: 'POST',
              body: `userid=${parameters.username}&password=${parameters.password}&email=${email}`,
              headers: {
                ...validAdminAuthHeaders,
                ...applicationFormUrlEncoded
              }
            })
          chai.assert.strictEqual(
            result.status, 200, `creating user '${parameters.username}' failed`
          )
          // a hack for https://github.com/owncloud/ocis/issues/1675
          fetch(providerBaseUrl + '/ocs/v2.php/cloud/capabilities',
            {
              method: 'GET',
              headers: { authorization: getAuthHeaders(parameters.username, parameters.password) }
            })
          return { description: 'user created' }
        }
      },
      'provider base url is returned': () => {
        return { providerBaseURL: providerBaseUrl }
      },
      'file version link is returned': (setup, parameters) => {
        if (setup) {
          const fileId = getFileId(parameters.username, parameters.password, parameters.fileName)
          const versionsResult = listVersionsFolder(parameters.username, parameters.password, fileId)
          let nodeValue = ''
          parseString(versionsResult, function (err, result) {
            if (
              err ||
              typeof result['d:multistatus']['d:response'][parameters.number]['d:href'][0] !== 'string'
            ) {
              throw new Error('could not parse PROPFIND response ' +
                              `to list versions of '${parameters.fileName}' ${err}`)
            }
            nodeValue = result['d:multistatus']['d:response'][parameters.number]['d:href'][0]
          })
          // strip away any subfolder, pact will add it again if neededq
          const link = nodeValue.replace(/^.*(\/remote\.php\/dav\/meta\/.*)$/, '$1')
          return { versionLink: link }
        }
      },
      'user is made group subadmin': (setup, parameters) => {
        // don't try to make users subadmins on OCIS because of
        // https://github.com/owncloud/product/issues/289
        if (setup && process.env.RUN_ON_OCIS !== 'true') {
          const response = fetch(providerBaseUrl +
                          '/ocs/v1.php/cloud/users/' + parameters.username +
                          '/subadmins?format=json', {
            method: 'POST',
            body: `groupid=${parameters.groupName}`,
            headers: {
              ...validAdminAuthHeaders,
              ...applicationFormUrlEncoded
            }
          })
          const { status } = getOCSMeta(response)
          chai.assert.strictEqual(status, 'ok',
          `making user ${parameters.username} subadmin of group ${parameters.groupName} failed`)
        }
        return {
          description: `user '${parameters.username}' made subadmin of group '${parameters.groupName}'`
        }
      },
      'user is added to group': (setup, parameters) => {
        if (setup) {
          const response = fetch(providerBaseUrl +
                          '/ocs/v1.php/cloud/users/' + parameters.username +
                          '/groups?format=json', {
            method: 'POST',
            body: `groupid=${parameters.groupName}`,
            headers: {
              ...validAdminAuthHeaders,
              ...applicationFormUrlEncoded
            }
          })
          const { status } = getOCSMeta(response)
          chai.assert.strictEqual(status, 'ok',
          `adding user ${parameters.username} to group ${parameters.groupName} failed`)
        }
        return {
          description: `user '${parameters.username}' added to group '${parameters.groupName}'`
        }
      },
      'resource is shared': (setup, parameters) => {
        if (setup) {
          const { username, password, resource, shareType, shareWith } = parameters
          const response = shareResource(username, password, resource, shareType, shareWith, parameters.permissions)

          const { status, statuscode, message } = getOCSMeta(response)

          if (process.env.RUN_ON_OCIS === 'true') {
            if (status === 'ok') {
              const { token } = getOCSData(response)
              lastSharedToken = token
              return getOCSData(response)
            } /* eslint brace-style: "off" */
            // TODO: refactor accordingly after the issue has been fixed
            // status 'error' and statuscode '996' means file/folder has already been shared with user or group
            // oCIS issue: https://github.com/owncloud/ocis/issues/1710
            else if (status === 'error' && statuscode === 996 && message === 'grpc create share request failed') {
              const res = getShareInfoByPath(username, password, resource)
              const { token } = getOCSData(res)[0]
              lastSharedToken = token
              return getOCSData(res)[0]
            } else {
              chai.assert.fail(`sharing file/folder '${parameters.resource}' failed`)
            }
          } else {
            chai.assert.strictEqual(status, 'ok', `sharing file/folder '${parameters.resource}' failed`)
            const { token } = getOCSData(response)
            lastSharedToken = token
            return getOCSData(response)
          }
        }
        return { description: 'file/folder shared' }
      },
      'folder exists in last shared public share': (setup, parameters) => {
        if (setup) {
          const { folderName } = parameters
          const response = createFolderInLastPublicShare(lastSharedToken, folderName)

          const { status } = response
          // 405 means that the folder already exists
          if (status !== 201 && status !== 405) {
            chai.assert.fail('creating folder in last public share failed')
          }
        }
        return { description: 'folder created in last shared public share' }
      },
      'file exists in last shared public share': (setup, parameters) => {
        if (setup) {
          const { fileName } = parameters
          const response = createFileInLastPublicShare(lastSharedToken, fileName)

          const { status } = response
          if (status !== 201 && status !== 204) {
            chai.assert.fail('creating file in last public share failed')
          }
        }
        return { description: 'file created in last shared public share' }
      },
      'signed-key is returned': (setup, parameters) => {
        if (setup) {
          let url = process.env.PROVIDER_BASE_URL + `/remote.php/dav/files/${parameters.username}/${parameters.path}`
          url = sanitizeUrl(url)
          const signKey = getSignKey(parameters.username, parameters.password)
          url = new URL(url)
          const date = new Date().toISOString()
          url.searchParams.set('OC-Credential', parameters.username)
          url.searchParams.set('OC-Date', date)
          url.searchParams.set('OC-Expires', '1200')
          url.searchParams.set('OC-Verb', 'GET')
          const hashedKey = createHashedKey(
            url.toString(),
            'sha512',
            signKey,
            10000
          )
          return {
            hashedKey: hashedKey,
            date: date
          }
        }
      }
    }
    return new VerifierV3(opts).verifyProvider().then(output => {
      console.log('Pact Verification Complete!')
      console.log('Result:', output)
    }).catch(function (error) {
      chai.assert.fail(error.message)
    })
  }, 600000)
})
