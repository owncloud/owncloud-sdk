const config = require('./config/config.json')

describe('provider testing', () => {
  const { VerifierV3 } = require('@pact-foundation/pact/v3')
  const chai = require('chai')
  const chaiAsPromised = require('chai-as-promised')
  const path = require('path')
  const fetch = require('sync-fetch')
  const { parseString } = require('xml2js')

  const {
    validAdminAuthHeaders
  } = require('./pactHelper.js')

  const {
    createFolderRecrusive,
    createFile,
    getFileId,
    listVersionsFolder
  } = require('./webdavHelper.js')

  chai.use(chaiAsPromised)

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

  it('verifies the provider', () => {
    const opts = {
      provider: 'oc-server',
      providerBaseUrl: process.env.PROVIDER_BASE_URL || 'http://localhost/',
      disableSSLVerification: true,
      callbackTimeout: 10000
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
              ...validAdminAuthHeaders,
              ...{ 'Content-Type': 'application/x-www-form-urlencoded' }
            }
          })
          return Promise.resolve({ description: 'group added' })
        } else {
          fetch(process.env.PROVIDER_BASE_URL + '/ocs/v1.php/cloud/groups/' + parameters.groupName, {
            method: 'DELETE',
            headers: validAdminAuthHeaders
          })
          return Promise.resolve({ description: 'group deleted' })
        }
      },
      'group does not exist': (setup, parameters) => {
        fetch(process.env.PROVIDER_BASE_URL + '/ocs/v1.php/cloud/groups/' + parameters.groupName, {
          method: 'DELETE',
          headers: validAdminAuthHeaders
        })
        return Promise.resolve({ description: 'group deleted' })
      },
      'folder exists': (setup, parameters) => {
        if (setup) {
          const results = createFolderRecrusive(
            parameters.username, parameters.password, parameters.folderName
          )
          assertFoldersCreatedSuccessfully(results, parameters.folderName)
        }
        return Promise.resolve({ description: 'folder created' })
      },
      'file exists': (setup, parameters) => {
        const dirname = path.dirname(parameters.fileName)
        if (setup) {
          if (dirname !== '' && dirname !== '/') {
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
        if (setup) {
          fetch(process.env.PROVIDER_BASE_URL + '/ocs/v2.php/cloud/users/' + parameters.username, {
            method: 'DELETE',
            headers: validAdminAuthHeaders
          })
          const result = fetch(process.env.PROVIDER_BASE_URL + '/ocs/v2.php/cloud/users',
            {
              method: 'POST',
              body: `userid=${parameters.username}&password=${parameters.password}`,
              headers: {
                ...validAdminAuthHeaders,
                ...{ 'Content-Type': 'application/x-www-form-urlencoded' }
              }
            })
          chai.assert.strictEqual(
            result.status, 200, `creating user '${parameters.username}' failed`
          )
          return Promise.resolve({ description: 'user created' })
        }
      },
      'provider base url is returned': () => {
        return { providerBaseURL: process.env.PROVIDER_BASE_URL }
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
