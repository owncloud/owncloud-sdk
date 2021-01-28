describe('provider testing', () => {
  const { VerifierV3 } = require('@pact-foundation/pact/v3')
  const chai = require('chai')
  const chaiAsPromised = require('chai-as-promised')
  const path = require('path')
  const fetch = require('sync-fetch')

  const {
    validAuthHeaders
  } = require('./pactHelper.js')

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
