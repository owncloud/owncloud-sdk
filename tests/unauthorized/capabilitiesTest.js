describe('Unauthorized: Currently testing getConfig, getVersion and getCapabilities', function () {
  const OwnCloud = require('../../src')
  const config = require('../config/config.json')
  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { capabilitiesGETRequestInvalidAuth } = require('../pactHelper.js')

  beforeAll(function (done) {
    const promises = []
    promises.push(provider.addInteraction(capabilitiesGETRequestInvalidAuth()))
    Promise.all(promises).then(done, done.fail)
  })

  afterAll(async function (done) {
    await provider.verify()
    provider.removeInteractions().then(done, done.fail)
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

    oc.login()
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
