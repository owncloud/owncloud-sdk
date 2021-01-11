describe('Unauthorized: Currently testing getConfig, getVersion and getCapabilities', function () {
  const config = require('../config/config.json')
  var timeRightNow = new Date().getTime()

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { capabilitiesGETRequestInvalidAuth, pactCleanup, createOwncloud } = require('../pactHelper.js')

  beforeAll(function () {
    return provider.addInteraction(capabilitiesGETRequestInvalidAuth())
  })

  afterAll(function () {
    return pactCleanup(provider)
  })

  beforeEach(function () {
    oc = createOwncloud(config.username, config.password + timeRightNow)

    return oc.login().then(() => {
      fail('not expected to log in')
    }).catch(err => {
      if (err !== 'Unauthorized') {
        throw new Error(err)
      }
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
