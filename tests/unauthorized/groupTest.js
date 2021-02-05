import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing group management,', function () {
  const config = require('../config/config.json')

  const {
    unauthorizedXmlResponseBody,
    createOwncloud,
    createProvider,
    getCapabilitiesWithInvalidAuthInteraction,
    invalidAuthHeader
  } = require('../pactHelper.js')

  const unauthorizedResponseObject = {
    status: 401,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8'
    },
    body: unauthorizedXmlResponseBody
  }

  const invalidAuthHeaderObject = {
    authorization: invalidAuthHeader
  }

  const groupsInteraction = (provider, method) => {
    return provider
      .uponReceiving(`a ${method} group(s) request with invalid auth`)
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
      .uponReceiving('a DELETE group request with invalid auth')
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
      .uponReceiving('a GET group member request with invalid auth')
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
    const provider = createProvider()

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await groupsInteraction(provider, 'GET')

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
    const provider = createProvider()

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await groupsInteraction(provider, 'POST')

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
    const provider = createProvider()

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await groupsInteraction(provider, 'GET')

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
    const provider = createProvider()

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
    const provider = createProvider()

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
