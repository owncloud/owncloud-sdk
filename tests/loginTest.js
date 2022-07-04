describe('Main: Currently testing Login and initLibrary,', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')
  const {
    admin: { username: adminUsername, password: adminPassword }
  } = require('./config/users.json')

  // CURRENT TIME
  const timeRightNow = Math.random().toString(36).slice(2, 11)

  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const nonExistentUser = 'nonExistentUser' + timeRightNow
  const invalidPassword = config.invalidPassword + timeRightNow

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
    await getCapabilitiesWithInvalidAuthInteraction(provider, nonExistentUser, invalidPassword)

    return provider.executeTest(async () => {
      oc = new OwnCloud({
        baseUrl: mockServerBaseUrl,
        auth: {
          basic: {
            username: nonExistentUser,
            password: invalidPassword
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
    await getCapabilitiesWithInvalidAuthInteraction(provider, adminUsername, invalidPassword)

    return provider.executeTest(async () => {
      oc = new OwnCloud({
        baseUrl: mockServerBaseUrl,
        auth: {
          basic: {
            username: adminUsername,
            password: invalidPassword
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

  it('checking method : login with correct username and password', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    return provider.executeTest(async () => {
      oc = new OwnCloud({
        baseUrl: mockServerBaseUrl,
        auth: {
          basic: {
            username: adminUsername,
            password: adminPassword
          }
        }
      })

      return oc.login().then(status => {
        expect(status).toEqual({ id: adminUsername, 'display-name': adminUsername, email: {} })
      }).catch(error => {
        fail(error)
      })
    })
  })
})
