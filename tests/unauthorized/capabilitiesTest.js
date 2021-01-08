describe('Unauthorized: Currently testing getConfig, getVersion and getCapabilities', function () {
  const OwnCloud = require('../../src')
  const config = require('../config/config.json')
  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { capabilitiesGETRequestInvalidAuth, pactCleanup } = require('../pactHelper.js')

  beforeAll(function () {
    return provider.addInteraction(capabilitiesGETRequestInvalidAuth())
  })

  afterAll(function () {
    return pactCleanup(provider)
  })

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password + new Date().getTime()
        }
      }
    })

    return oc.login().then(() => {
      fail('not expected to log in')
    }).catch(() => {

    })
  })

  it('checking method : getCapabilities', function (done) {
    oc.getCapabilities().then(capabilities => {
      expect(capabilities).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })
})
