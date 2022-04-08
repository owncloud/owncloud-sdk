const config = require('./config/config.json')
const {
  getOCSMeta,
  getOCSData
} = require('./helpers/ocsResponseParser')

const TEST_TIMEOUT = 600000

// environment variables
const PACTFLOW_TOKEN = process.env.PACTFLOW_TOKEN
const DRONE_SOURCE_BRANCH = process.env.DRONE_SOURCE_BRANCH
const PROVIDER_VERSION = process.env.PROVIDER_VERSION

const isRunningWithOCIS = () => {
  return (process.env.RUN_ON_OCIS === 'true')
}
const isRunningOnCI = () => {
  return (process.env.CI === 'true')
}

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
    sanitizeUrl,
    getProviderBaseUrl
  } = require('./helpers/pactHelper.js')

  const {
    createFolderRecursive,
    createFile,
    getFileId,
    listVersionsFolder,
    getSignKey,
    deleteItem,
    getTrashBinElements,
    markAsFavorite,
    createASystemTag,
    assignTagToFile,
    getTagId
  } = require('./helpers/webdavHelper.js')

  const {
    shareResource,
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
  if (isRunningOnCI()) {
    defaultOpts.pactBrokerUrl = 'https://jankaritech.pactflow.io'
    defaultOpts.publishVerificationResult = true
    defaultOpts.pactBrokerToken = PACTFLOW_TOKEN
    defaultOpts.consumerVersionTags = DRONE_SOURCE_BRANCH
    defaultOpts.providerVersion = PROVIDER_VERSION
    defaultOpts.providerVersionTags = PROVIDER_VERSION
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
        const results = createFolderRecursive(
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
          const results = createFolderRecursive(
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
      if (setup && !isRunningWithOCIS()) {
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
        const { status } = getOCSMeta(response)

        chai.assert.strictEqual(status, 'ok', `Sharing file/folder '${parameters.path}' failed`)

        const { token } = getOCSData(response)
        lastSharedToken = token

        return getOCSData(response)
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
    'the client waits': (setup, parameters) => {
      if (setup) {
        delay(parameters.delay)
      }
    },
    'file is marked as favorite': (setup, parameters) => {
      if (setup) {
        const { username, password, path } = parameters
        const { status } = markAsFavorite(username, password, path)

        if (status !== 207) {
          chai.assert.fail(`Failed to mark file '${path}' as favorite.`)
        }
      }
    },
    'a system tag is created': (setup, parameters) => {
      if (setup) {
        const { username, password, tag } = parameters
        const response = createASystemTag(username, password, tag)
        let tagId
        if (response.status === 409 && response.text().includes('Tag already exists')) {
          tagId = getTagId(username, password, tag)
        } else if (response.status === 201) {
          tagId = response.headers.get('Content-Location').split('/').pop()
        }
        /* eslint brace-style: "off" */
        // tagging not implement on oCIS
        else if (isRunningWithOCIS() && response.status === 404) {
          tagId = ''
        } else {
          chai.assert.fail(`Failed to create a system tag '${tag}'`)
        }
        return { tagId }
      }
    },
    'a tag is assigned to a file': (setup, parameters) => {
      if (setup) {
        const { username, password, fileName, tagName } = parameters
        // tagging not implement on oCIS
        if (isRunningWithOCIS()) {
          return
        }
        const { status } = assignTagToFile(username, password, fileName, tagName)

        if (status !== 201) {
          chai.assert.fail('Failed to assign last created tag to last created file')
        }
      }
    }
  }

  describe('oc10 as provider', () => {
    it('verifies the contract with finished interactions', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server'
      if (!isRunningOnCI()) {
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
    }, TEST_TIMEOUT)

    it('verifies the contract pending on ocis', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-ocis'
      if (!isRunningOnCI()) {
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
    }, TEST_TIMEOUT)

    it('verifies the contract pending on oC10', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-oc10'
      opts.enablePending = true
      if (!isRunningOnCI()) {
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
    }, TEST_TIMEOUT)

    it('verifies the contract pending on oC10 & ocis', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-oc10-ocis'
      opts.enablePending = true
      if (!isRunningOnCI()) {
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
    }, TEST_TIMEOUT)
  })

  describe('ocis as provider', () => {
    it('verifies the contract with finished interactions', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server'
      if (!isRunningOnCI()) {
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
    }, TEST_TIMEOUT)

    it('verifies the contract pending on oC10', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-oc10'
      if (!isRunningOnCI()) {
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
    }, TEST_TIMEOUT)

    it('verifies the contract pending on ocis', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-ocis'
      opts.enablePending = true
      if (!isRunningOnCI()) {
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
    }, TEST_TIMEOUT)

    it('verifies the contract pending on oC10 & ocis', () => {
      const opts = defaultOpts
      opts.provider = 'oc-server-pendingOn-oc10-ocis'
      opts.enablePending = true
      if (!isRunningOnCI()) {
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
    }, TEST_TIMEOUT)
  })
})
