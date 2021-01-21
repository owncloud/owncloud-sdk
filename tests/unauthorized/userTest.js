import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing user management,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var config = require('../config/config.json')

  const {
    invalidAuthHeader,
    capabilitiesGETRequestInvalidAuth,
    createOwncloud
  } = require('../pactHelper.js')
  const {
    unauthorizedXmlResponseBody,
    createProvider
  } = require('../pactHelper.js')

  const request = async (provider, requestName, method, path, query) => {
    return provider
      .uponReceiving(requestName)
      .withRequest({
        method: method,
        path: path,
        headers: {
          authorization: invalidAuthHeader
        },
        query: query
      })
      .willRespondWith({
        status: 401,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8'
        },
        body: unauthorizedXmlResponseBody
      })
  }

  const adminUserEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/admin$',
    '/ocs/v1.php/cloud/users/admin'
  )

  const usersEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
    '/ocs/v1.php/cloud/users'
  )

  const groupsEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/groups$',
    '/ocs/v1.php/cloud/users/' + config.testUser + '/groups'
  )

  const subadminsUserEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/subadmins$',
    '/ocs/v1.php/cloud/users/' + config.testUser + '/subadmins'
  )

  const testUserEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '$',
    '/ocs/v1.php/cloud/users/' + config.testUser
  )

  const nonExistingUserEndpoint = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '$',
    '/ocs/v1.php/cloud/users/' + config.nonExistentUser
  )

  // TESTING CONFIGS
  var testUserPassword = 'password'

  it('checking method : getUser', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a GET request with invalid auth to check for user admin', 'GET', adminUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.getUser(config.username).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : createUser', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a create user POST request with invalid auth', 'POST', usersEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.createUser('newUser' + timeRightNow, testUserPassword).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : searchUsers', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a GET request with invalid auth to search user', 'GET', usersEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.searchUsers('').then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : userExists', async function () {
    const provider = createProvider()
    const query = { search: 'admin' }

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a admin GET request with invalid auth', 'GET', usersEndpointPath, query)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.userExists(config.username).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : setUserAttribute', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a user PUT request with invalid auth to add user to group', 'PUT', testUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.setUserAttribute(config.testUser, 'email', 'asd@a.com').then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : addUserToGroup', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a user POST request with invalid auth', 'POST', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.addUserToGroup(config.testUser, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getUserGroups', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a GET request with invalid auth to get user in group', 'GET', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.getUserGroups(config.testUser).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : userIsInGroup', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a GET request with invalid auth to check for user', 'GET', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.userIsInGroup(config.testUser, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getUser', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a GET request with invalid auth to check for user endpoint', 'GET', testUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.getUser(config.testUser).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : removeUserFromGroup', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a DELETE request with invalid auth to remove user from group', 'DELETE', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.removeUserFromGroup(config.testUser, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : addUserToSubadminGroup', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a POST request with invalid auth to add user to subadmin group', 'POST', subadminsUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.addUserToSubadminGroup(config.testUser, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getUserSubadminGroups', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a GET request with invalid auth to get user of subadmin group', 'GET', subadminsUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.getUserSubadminGroups(config.testUser).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : userIsInSubadminGroup', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a GET request with invalid auth to check user is in subadmin group', 'GET', subadminsUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.userIsInSubadminGroup(config.testUser, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : deleteUser', async function () {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await request(provider, 'a request to DELETE a non-existent user with invalid auth', 'DELETE', nonExistingUserEndpoint)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.deleteUser(config.nonExistentUser).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })
})
