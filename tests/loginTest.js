describe('Main: Currently testing Login and initLibrary,', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // CURRENT TIME
  var timeRightNow = Math.random().toString(36).slice(2, 11)

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var nonExistentUser = 'nonExistentUser' + timeRightNow

  // PACT setup
  const {
    createProvider,
    getCapabilitiesWithInvalidAuthInteraction,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    getMockServerBaseUrl
  } = require('./helpers/pactHelper.js')

  const mockServerBaseUrl = getMockServerBaseUrl()

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
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider, nonExistentUser, 'config.adminPassword' + timeRightNow)

    return provider.executeTest(async () => {
      oc = new OwnCloud({
        baseUrl: mockServerBaseUrl,
        auth: {
          basic: {
            username: nonExistentUser,
            password: 'config.adminPassword' + timeRightNow
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
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider, config.adminUsername, 'config.adminPassword' + timeRightNow)

    return provider.executeTest(async () => {
      oc = new OwnCloud({
        baseUrl: mockServerBaseUrl,
        auth: {
          basic: {
            username: config.adminUsername,
            password: 'config.adminPassword' + timeRightNow
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

  it('checking method : login with correct config.adminUsername and config.adminPassword', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    return provider.executeTest(async () => {
      oc = new OwnCloud({
        baseUrl: mockServerBaseUrl,
        auth: {
          basic: {
            username: config.adminUsername,
            password: config.adminPassword
          }
        }
      })

      return oc.login().then(status => {
        expect(status).toEqual({ id: config.adminUsername, 'display-name': config.adminUsername, email: {} })
      }).catch(error => {
        fail(error)
      })
    })
  })
})
