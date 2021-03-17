const config = require('./config/config.json')
const {
  getOCSMeta,
  getOCSData
} = require('./helpers/ocsResponseParser')

let lastSharedToken = ''
const crypto = require('crypto')

const delay = (delayTime) => {
  var start = new Date().getTime()
  while (new Date().getTime() < start + delayTime);
}

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
    sanitizeUrl,
    getProviderBaseUrl
  } = require('./pactHelper.js')

  const {
    createFolderRecrusive,
    createFile,
    getFileId,
    listVersionsFolder,
    getSignKey,
    deleteItem,
    getTrashBinElements
  } = require('./webdavHelper.js')

  const {
    shareResource,
    getShareInfoByPath,
    createFolderInLastPublicShare,
    createFileInLastPublicShare
  } = require('./helpers/sharingHelper.js')

  chai.use(chaiAsPromised)

  const providerBaseUrl = getProviderBaseUrl()

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

  const defaultOpts = {
    providerBaseUrl,
    disableSSLVerification: true,
    callbackTimeout: 10000
  }
  if (process.env.CI === 'true') {
    defaultOpts.pactBrokerUrl = 'https://jankaritech.pactflow.io'
    defaultOpts.publishVerificationResult = true
    defaultOpts.pactBrokerToken = process.env.PACTFLOW_TOKEN
    defaultOpts.consumerVersionTags = process.env.DRONE_SOURCE_BRANCH
    defaultOpts.providerVersion = process.env.PROVIDER_VERSION
  }
  defaultOpts.stateHandlers = {
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
      const content = parameters.content || config.testContent
      if (setup) {
        if (dirname !== '' && dirname !== '/' && dirname !== '.') {
          const results = createFolderRecrusive(
            parameters.username, parameters.password, dirname
          )
          assertFoldersCreatedSuccessfully(results, dirname)
        }
        const result = createFile(
          parameters.username, parameters.password, parameters.fileName, content
        )
        chai.assert.isBelow(
          result.status, 300, `creating file '${parameters.fileName}' failed`
        )
        return { fileId: result.headers.get('oc-fileid') }
      }
    },
    'resource is deleted': (setup, parameters) => {
      if (!setup) {
        return
      }
      const dirname = parameters.resourcePath
      const result = deleteItem(parameters.username, parameters.password, dirname)
      chai.assert.isBelow(
        result.status, 300, `Deleting path '${dirname}' failed`
      )
      const items = getTrashBinElements(parameters.username, parameters.password)
      let found = false
      let id
      for (const item of items) {
        if (item.originalLocation === parameters.resourcePath) {
          found = true
          const parts = item.href.split('/').filter(el => el !== '')
          id = parts[parts.length - 1]
          break
        }
      }

      chai.assert.isTrue(found, 'Deleted item not found in trash')
      return { description: 'resource deleted', trashId: id }
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
        const { username, userPassword, ...shareParams } = parameters
        const response = shareResource(username, userPassword, shareParams)

        const {
          status,
          statuscode,
          message
        } = getOCSMeta(response)

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
            const res = getShareInfoByPath(username, userPassword, parameters.path)
            const { token } = getOCSData(res)[0]
            lastSharedToken = token
            return getOCSData(res)[0]
          } else {
            chai.assert.fail(`sharing file/folder '${parameters.path}' failed`)
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
        const {
          fileName,
          content
        } = parameters
        const response = createFileInLastPublicShare(lastSharedToken, fileName, content)

        const { status } = response
        if (status !== 201 && status !== 204) {
          chai.assert.fail('creating file in last public share failed')
        }
      }
      return { description: 'file created in last shared public share' }
    },
    'signed-key is returned': (setup, parameters) => {
      if (setup) {
        let url = providerBaseUrl + `/remote.php/dav/files/${parameters.username}/${parameters.path}`
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
    },
    'the client waits': (setup, paramters) => {
      if (setup) {
        delay(paramters.delay)
      }
    }
  }

  describe('oc10 as provider', () => {
    it('verifies the contract with finished interactions', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server'
      if (process.env.CI !== 'true') {
        opts.pactUrls = [path.resolve(
          process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server.json'
        )]
      }

      return new VerifierV3(opts).verifyProvider().then(output => {
        console.log('Pact Verification Complete!')
        console.log('Result:', output)
      }).catch(function () {
        chai.assert.fail()
      })
    }, 600000)

    it('verifies the contract pending on ocis', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-ocis'
      if (process.env.CI !== 'true') {
        opts.pactUrls = [path.resolve(
          process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server-pendingOn-ocis.json'
        )]
      }

      return new VerifierV3(opts).verifyProvider().then(output => {
        console.log('Pact Verification Complete!')
        console.log('Result:', output)
      }).catch(function () {
        chai.assert.fail()
      })
    }, 600000)

    it('verifies the contract pending on oC10', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-oc10'
      opts.enablePending = true
      if (process.env.CI !== 'true') {
        opts.pactUrls = [path.resolve(
          process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server-pendingOn-oc10.json'
        )]
      }

      return new VerifierV3(opts).verifyProvider().then(output => {
        console.log('Pact Verification Complete!')
        console.log('Result:', output)
      }).catch(function () {
        chai.assert.fail()
      })
    }, 600000)

    it('verifies the contract pending on oC10 & ocis', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-oc10-ocis'
      opts.enablePending = true
      if (process.env.CI !== 'true') {
        opts.pactUrls = [path.resolve(
          process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server-pendingOn-oc10-ocis.json'
        )]
      }
      return new VerifierV3(opts).verifyProvider().then(output => {
        console.log('Pact Verification Complete!')
        console.log('Result:', output)
      }).catch(function () {
        chai.assert.fail()
      })
    }, 600000)
  })

  describe('ocis as provider', () => {
    it('verifies the contract with finished interactions', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server'
      if (process.env.CI !== 'true') {
        opts.pactUrls = [path.resolve(
          process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server.json'
        )]
      }

      return new VerifierV3(opts).verifyProvider().then(output => {
        console.log('Pact Verification Complete!')
        console.log('Result:', output)
      }).catch(function () {
        chai.assert.fail()
      })
    }, 600000)

    it('verifies the contract pending on oC10', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-oc10'
      if (process.env.CI !== 'true') {
        opts.pactUrls = [path.resolve(
          process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server-pendingOn-oc10.json'
        )]
      }

      return new VerifierV3(opts).verifyProvider().then(output => {
        console.log('Pact Verification Complete!')
        console.log('Result:', output)
      }).catch(function () {
        chai.assert.fail()
      })
    }, 600000)

    it('verifies the contract pending on ocis', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-ocis'
      opts.enablePending = true
      if (process.env.CI !== 'true') {
        opts.pactUrls = [path.resolve(
          process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server-pendingOn-ocis.json'
        )]
      }

      return new VerifierV3(opts).verifyProvider().then(output => {
        console.log('Pact Verification Complete!')
        console.log('Result:', output)
      }).catch(function () {
        chai.assert.fail()
      })
    }, 600000)

    it('verifies the contract pending on oC10 & ocis', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-oc10-ocis'
      opts.enablePending = true
      if (process.env.CI !== 'true') {
        opts.pactUrls = [path.resolve(
          process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server-pendingOn-oc10-ocis.json'
        )]
      }
      return new VerifierV3(opts).verifyProvider().then(output => {
        console.log('Pact Verification Complete!')
        console.log('Result:', output)
      }).catch(function () {
        chai.assert.fail()
      })
    }, 600000)
  })
})
