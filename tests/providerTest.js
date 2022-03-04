const { testContent } = require('./config/config.json')
const {
  getOCSMeta,
  getOCSData
} = require('./helpers/ocsResponseParser')

const { isRunningWithOCIS, isRunningOnCI } = require('./config/env')
const {
  createUser,
  deleteUser,
  createGroup,
  deleteGroup,
  addToGroup,
  makeUserGroupSubadmin
} = require('./helpers/provisioningHelper')

const TEST_TIMEOUT = 600000

// environment variables
const PACTFLOW_TOKEN = process.env.PACTFLOW_TOKEN
const DRONE_SOURCE_BRANCH = process.env.DRONE_SOURCE_BRANCH
const PROVIDER_VERSION = process.env.PROVIDER_VERSION

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
  const { parseString } = require('xml2js')

  const {
    validAdminAuthHeaders,
    applicationFormUrlEncodedContentType,
    getAuthHeaders,
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
        createGroup(parameters.groupName)
        fetch(providerBaseUrl + '/ocs/v1.php/cloud/groups', {
          method: 'POST',
          body: 'groupid=' + parameters.groupName,
          headers: {
            ...validAdminAuthHeaders,
            ...applicationFormUrlEncodedContentType
          }
        })
        return { description: 'group added' }
      } else {
        deleteGroup(parameters.groupName)
        return { description: 'group deleted' }
      }
    },
    'group does not exist': (setup, parameters) => {
      deleteGroup(parameters.groupName)
      return { description: 'group deleted' }
    },
    'folder exists': (setup, parameters) => {
      if (setup) {
        const results = createFolderRecursive(
          parameters.username,
          parameters.folderName
        )
        assertFoldersCreatedSuccessfully(results, parameters.folderName)
      }
      return { description: 'folder created' }
    },
    'file exists': (setup, parameters) => {
      const dirname = path.dirname(parameters.fileName)
      const content = parameters.content || testContent
      if (setup) {
        if (dirname !== '' && dirname !== '/' && dirname !== '.') {
          const results = createFolderRecursive(parameters.username, dirname)
          assertFoldersCreatedSuccessfully(results, dirname)
        }
        const result = createFile(
          parameters.username, parameters.fileName, content
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
      const resourcePath = parameters.resourcePath
      const result = deleteItem(parameters.username, resourcePath)
      chai.assert.isBelow(
        result.status, 300, `Deleting path '${resourcePath}' failed`
      )
      const items = getTrashBinElements(parameters.username)
      let found = false
      let id
      for (const item of items) {
        if (item.originalLocation === resourcePath) {
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
      if (setup) {
        deleteUser(parameters.username)
        const result = createUser(parameters.username)
        chai.assert.strictEqual(
          result.status, 200, `creating user '${parameters.username}' failed`
        )
        return { description: 'user created' }
      }
    },
    'user doesn\'t exist': (setup, parameters) => {
      if (setup) {
        const { status } = deleteUser(parameters.username)

        chai.assert.include([200, 204], status, `deleting user '${parameters.username}' failed`
        )
        return { description: 'user deleted' }
      }
    },
    'provider base url is returned': () => {
      return { providerBaseURL: providerBaseUrl }
    },
    'file version link is returned': (setup, parameters) => {
      if (setup) {
        const fileId = getFileId(parameters.username, parameters.fileName)
        const versionsResult = listVersionsFolder(parameters.username, fileId)
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
        const response = makeUserGroupSubadmin(parameters.username, parameters.groupName)
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
        const { status } = addToGroup(parameters.username, parameters.groupName)
        // when running with oCIS, adding user to group returns 204 status code
        // but the user is added to the group
        chai.assert.include([200, 204], status,
          `adding user ${parameters.username} to group ${parameters.groupName} failed`)
      }
      return {
        description: `user '${parameters.username}' added to group '${parameters.groupName}'`
      }
    },
    'resource is shared': (setup, parameters) => {
      if (setup) {
        const { username, ...shareParams } = parameters
        const response = shareResource(username, shareParams)
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
        const { folderName, password } = parameters
        const response = createFolderInLastPublicShare(lastSharedToken, folderName, password)

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
          password,
          content
        } = parameters
        const response = createFileInLastPublicShare(lastSharedToken, fileName, password, content)

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
        const signKey = getSignKey(parameters.username)
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
        const { username, path } = parameters
        const { status } = markAsFavorite(username, path)

        if (status !== 207) {
          chai.assert.fail(`Failed to mark file '${path}' as favorite.`)
        }
      }
    },
    'a system tag is created': (setup, parameters) => {
      if (setup) {
        const { username, tag } = parameters
        const response = createASystemTag(username, tag)
        let tagId
        if (response.status === 409 && response.text().includes('Tag already exists')) {
          tagId = getTagId(username, tag)
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
        const { username, fileName, tagName } = parameters
        // tagging not implement on oCIS
        if (isRunningWithOCIS()) {
          return
        }
        const { status } = assignTagToFile(username, fileName, tagName)

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
