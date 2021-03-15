// [oCIS] HTTP 401 Unauthorized responses don't contain a body
// https://github.com/owncloud/ocis/issues/1293

import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing user management,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var config = require('../config/config.json')
  const username = config.adminUsername

  const {
    invalidAuthHeader,
    xmlResponseHeaders,
    getCapabilitiesWithInvalidAuthInteraction,
    createOwncloud
  } = require('../pactHelper.js')
  const {
    unauthorizedXmlResponseBody,
    createProvider
  } = require('../pactHelper.js')

  const invalidAuthInteraction = (provider, requestName, method, path, query) => {
    return provider
      .uponReceiving(`as '${username}', a ${method} request to ${requestName} with invalid auth`)
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
        headers: xmlResponseHeaders,
        body: unauthorizedXmlResponseBody
      })
  }

  const adminUserEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.adminUsername + '$',
    '/ocs/v1.php/cloud/users/' + config.adminUsername
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'admin user', 'GET', adminUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.getUser(config.adminUsername).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : createUser', async function () {
    const provider = createProvider()

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'create a user', 'POST', usersEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'search users', 'GET', usersEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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
    const query = { search: config.adminUsername }

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'check user existence', 'GET', usersEndpointPath, query)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.userExists(config.adminUsername).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : setUserAttribute', async function () {
    const provider = createProvider()

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'edit user', 'PUT', testUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'add user to a group', 'POST', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'get users of a group', 'GET', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'check user existence in a group', 'GET', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'normal user', 'GET', testUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'remove user from a group', 'DELETE', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'add a user to subadmin group', 'POST', subadminsUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'get users of subadmin group', 'GET', subadminsUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'check user existence in subadmin group', 'GET', subadminsUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'delete a non-existent user', 'DELETE', nonExistingUserEndpoint)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
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
