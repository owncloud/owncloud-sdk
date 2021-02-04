const config = require('./config/config.json')

describe('provider testing', () => {
  const { VerifierV3 } = require('@pact-foundation/pact/v3')
  const chai = require('chai')
  const chaiAsPromised = require('chai-as-promised')
  const path = require('path')
  const fetch = require('sync-fetch')

  const {
    validAuthHeaders
  } = require('./pactHelper.js')

  const {
    createFolderRecrusive,
    createFile,
    deleteItem
  } = require('./webdavHelper.js')

  chai.use(chaiAsPromised)

  it('verifies the provider', () => {
    const opts = {
      provider: 'oc-server',
      logLevel: 'debug',
      providerBaseUrl: process.env.PROVIDER_BASE_URL || 'http://localhost/',
      disableSSLVerification: true
    }
    if (process.env.CI === 'true') {
      opts.pactBrokerUrl = 'https://jankaritech.pactflow.io'
      opts.publishVerificationResult = true
      opts.pactBrokerToken = process.env.PACTFLOW_TOKEN
      opts.enablePending = true
      opts.consumerVersionSelectors = [
        {
          tag: process.env.DRONE_SOURCE_BRANCH,
          latest: true
        }
      ]
      opts.providerVersion = process.env.PROVIDER_VERSION
    } else {
      opts.pactUrls = [path.resolve(process.cwd(), 'tests', 'pacts', 'owncloud-sdk-oc-server.json')]
    }

    opts.stateHandlers = {
      'group exists': (setup, parameters) => {
        if (setup) {
          fetch(process.env.PROVIDER_BASE_URL + '/ocs/v1.php/cloud/groups', {
            method: 'POST',
            body: 'groupid=' + parameters.groupName,
            headers: {
              ...validAuthHeaders,
              ...{ 'Content-Type': 'application/x-www-form-urlencoded' }
            }
          })
          return Promise.resolve({ description: 'group added' })
        } else {
          fetch(process.env.PROVIDER_BASE_URL + '/ocs/v1.php/cloud/groups/' + parameters.groupName, {
            method: 'DELETE',
            headers: validAuthHeaders
          })
          return Promise.resolve({ description: 'group deleted' })
        }
      },
      'group does not exist': (setup, parameters) => {
        fetch(process.env.PROVIDER_BASE_URL + '/ocs/v1.php/cloud/groups/' + parameters.groupName, {
          method: 'DELETE',
          headers: validAuthHeaders
        })
        return Promise.resolve({ description: 'group deleted' })
      },
      'folder exists': (setup, parameters) => {
        if (setup) {
          const results = createFolderRecrusive(config.username, parameters.folderName)
          chai.assert.isBelow(
            results[0].status, 300, `creating folder '${parameters.folderName}' failed`
          )
        }
        return Promise.resolve({ description: 'folder created' })
      },
      'file exists': (setup, parameters) => {
        const dirname = path.dirname(parameters.fileName)
        if (setup) {
          if (dirname !== '' && dirname !== '/') {
            const results = createFolderRecrusive(config.username, dirname)
            for (let i = 0; i < results.length; i++) {
              chai.assert.isBelow(
                results[i].status, 300, `creating folder '${dirname}' failed'`
              )
            }
          }
          const result = createFile(config.username, parameters.fileName, config.testContent)
          chai.assert.isBelow(
            result.status, 300, `creating file '${parameters.fileName}' failed`
          )
        } else {
          let itemToDelete
          if (dirname !== '' && dirname !== '/') {
            const folders = dirname.split(path.sep)
            itemToDelete = folders[0]
          } else {
            itemToDelete = parameters.fileName
          }
          const result = deleteItem(config.username, itemToDelete)
          chai.assert.strictEqual(
            result.status, 204, `deleting '${itemToDelete}' failed`
          )
        }
        return Promise.resolve({ description: 'file created' })
      }
    }
    return new VerifierV3(opts).verifyProvider().then(output => {
      console.log('Pact Verification Complete!')
      console.log('Result:', output)
    }).catch(function (error) {
      chai.assert.fail(error.message)
    })
  }, 60000)
})
