// [oCIS] HTTP 401 Unauthorized responses don't contain a body
// https://github.com/owncloud/ocis/issues/1293

import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing group management,', function () {
  const config = require('../config/config.json')
  const username = config.adminUsername

  const {
    unauthorizedXmlResponseBody,
    createOwncloud,
    createProvider,
    getCapabilitiesWithInvalidAuthInteraction,
    invalidAuthHeader,
    xmlResponseHeaders
  } = require('../pactHelper.js')

  const unauthorizedResponseObject = {
    status: 401,
    headers: xmlResponseHeaders,
    body: unauthorizedXmlResponseBody
  }

  const invalidAuthHeaderObject = {
    authorization: invalidAuthHeader
  }

  const groupsInteraction = (provider, requestName, method) => {
    return provider
      .uponReceiving(`as '${username}', a ${method} request to ${requestName} with invalid auth`)
      .withRequest({
        method: method,
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/groups$',
          '/ocs/v1.php/cloud/groups'
        ),
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  const deleteGroupInteraction = (provider) => {
    return provider
      .uponReceiving(`as '${username}', a DELETE request to delete a group with invalid auth`)
      .withRequest({
        method: 'DELETE',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/groups\\/.*',
          `/ocs/v1.php/cloud/groups/${config.testGroup}`
        ),
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  const getGroupMembersInteraction = (provider) => {
    return provider
      .uponReceiving(`as '${username}', a GET request to get members of a group with invalid auth`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/groups\\/.*',
          `/ocs/v1.php/cloud/groups/${config.testGroup}`
        ),
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  it('checking method : getGroups', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await groupsInteraction(provider, 'get all groups', 'GET')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch(error => {
        expect(error).toBe('Unauthorized')
      })

      return oc.groups.getGroups().then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : createGroup', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await groupsInteraction(provider, 'create a group', 'POST')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch(error => {
        expect(error).toBe('Unauthorized')
      })

      return oc.groups.createGroup('newGroup').then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : groupExists', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await groupsInteraction(provider, 'check group existence', 'GET')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch(error => {
        expect(error).toBe('Unauthorized')
      })

      return oc.groups.groupExists('admin').then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : deleteGroup', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await deleteGroupInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch(error => {
        expect(error).toBe('Unauthorized')
      })

      return oc.groups.deleteGroup(config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getGroupMembers', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await getGroupMembersInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch(error => {
        expect(error).toBe('Unauthorized')
      })

      return oc.groups.getGroupMembers('admin').then(data => {
        expect(data).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })
})
