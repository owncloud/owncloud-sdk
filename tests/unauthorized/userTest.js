// [oCIS] HTTP 401 Unauthorized responses don't contain a body
// https://github.com/owncloud/ocis/issues/1293

import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing user management,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var config = require('../config/config.json')
  const { admin: { username: adminUsername }, Alice } = require('../config/users.json')

  const {
    invalidAuthHeader,
    xmlResponseHeaders,
    getCapabilitiesWithInvalidAuthInteraction,
    createOwncloud,
    unauthorizedXmlResponseBody,
    createProvider
  } = require('../helpers/pactHelper.js')

  const invalidAuthInteraction = (provider, requestName, method, path, query) => {
    return provider
      .uponReceiving(`as '${adminUsername}', a ${method} request to ${requestName} with invalid auth`)
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
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + adminUsername + '$',
    '/ocs/v1.php/cloud/users/' + adminUsername
  )

  const usersEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
    '/ocs/v1.php/cloud/users'
  )

  const groupsEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + Alice.username + '\\/groups$',
    '/ocs/v1.php/cloud/users/' + Alice.username + '/groups'
  )

  const subadminsUserEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + Alice.username + '\\/subadmins$',
    '/ocs/v1.php/cloud/users/' + Alice.username + '/subadmins'
  )

  const testUserEndpointPath = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + Alice.username + '$',
    '/ocs/v1.php/cloud/users/' + Alice.username
  )

  const nonExistingUserEndpoint = MatchersV3.regex(
    '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '$',
    '/ocs/v1.php/cloud/users/' + config.nonExistentUser
  )

  // TESTING CONFIGS
  var testUserPassword = 'password'

  it('checking method : getUser', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'admin user', 'GET', adminUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.getUser(adminUsername).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : createUser', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'create a user', 'POST', usersEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
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
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'search users', 'GET', usersEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
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
    const provider = createProvider(false, true)
    const query = { search: adminUsername }

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'check user existence', 'GET', usersEndpointPath, query)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.userExists(adminUsername).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : setUserAttribute', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'edit user', 'PUT', testUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.setUserAttribute(Alice.username, 'email', 'asd@a.com').then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : addUserToGroup', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'add user to a group', 'POST', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.addUserToGroup(Alice.username, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getUserGroups', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'get users of a group', 'GET', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.getUserGroups(Alice.username).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : userIsInGroup', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'check user existence in a group', 'GET', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.userIsInGroup(Alice.username, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getUser', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'normal user', 'GET', testUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.getUser(Alice.username).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : removeUserFromGroup', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'remove user from a group', 'DELETE', groupsEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.removeUserFromGroup(Alice.username, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : addUserToSubadminGroup', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'add a user to subadmin group', 'POST', subadminsUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.addUserToSubadminGroup(Alice.username, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getUserSubadminGroups', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'get users of subadmin group', 'GET', subadminsUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.getUserSubadminGroups(Alice.username).then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : userIsInSubadminGroup', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'check user existence in subadmin group', 'GET', subadminsUserEndpointPath)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.users.userIsInSubadminGroup(Alice.username, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : deleteUser', async function () {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await invalidAuthInteraction(provider, 'delete a non-existent user', 'DELETE', nonExistingUserEndpoint)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
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
