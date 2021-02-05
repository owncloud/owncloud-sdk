describe('Main: Currently testing Login and initLibrary,', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // CURRENT TIME
  var timeRightNow = Math.random().toString(36).substr(2, 9)

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var nonExistentUser = 'nonExistentUser' + timeRightNow

  // PACT setup
  const {
    createProvider,
    getCapabilitiesWithInvalidAuthInteraction,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction
  } = require('./pactHelper.js')

  beforeEach(function () {
    oc = null
  })

  it('checking method : initLibrary to be null', function () {
    expect(oc).toBe(null)
  })

  it('checking method : initLibrary', function () {
    oc = new OwnCloud()

    expect(oc).not.toBe(null)
  })

  it('checking method : login with a non existent instance URL', function () {
    try {
      oc = new OwnCloud({
        baseUrl: 'someRandomName'
      })
      fail('constructor will throw an exception if an invalid URL is passed in')
    } catch (error) {
      expect(error).not.toBe(null)
    }
  })

  it('checking method : login with wrong username and password', async function () {
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider, nonExistentUser, 'config.password' + timeRightNow)

    return provider.executeTest(async () => {
      oc = new OwnCloud({
        baseUrl: config.owncloudURL,
        auth: {
          basic: {
            username: nonExistentUser,
            password: 'config.password' + timeRightNow
          }
        }
      })

      return oc.login().then(() => {
        fail()
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : login with correct username only', async function () {
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider, config.username, 'config.password' + timeRightNow)

    return provider.executeTest(async () => {
      oc = new OwnCloud({
        baseUrl: config.owncloudURL,
        auth: {
          basic: {
            username: config.username,
            password: 'config.password' + timeRightNow
          }
        }
      })

      return oc.login().then(() => {
        fail()
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : login with correct config.username and config.password', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    return provider.executeTest(async () => {
      oc = new OwnCloud({
        baseUrl: config.owncloudURL,
        auth: {
          basic: {
            username: config.username,
            password: config.password
          }
        }
      })

      return oc.login().then(status => {
        expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      }).catch(error => {
        fail(error)
      })
    })
  })
})
