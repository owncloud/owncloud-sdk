import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing group management,', function () {
  const config = require('../config/config.json')

  const {
    unauthorizedXmlResponseBody,
    createOwncloud,
    createProvider,
    capabilitiesGETRequestInvalidAuth,
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

  const groupsRequest = (provider, method) => {
    return provider
      .uponReceiving(`a ${method} group(s) request with invalid auth`)
      .withRequest({
        method: method,
        path: MatchersV3.regex(
          '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/groups.*',
          '/ocs/v1.php/cloud/groups'
        ),
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  const DELETEGroupRequest = (provider) => {
    return provider
      .uponReceiving('a DELETE group request with invalid auth')
      .withRequest({
        method: 'DELETE',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/groups\\/.*',
          '/ocs/v1.php/cloud/groups/' + config.testGroup
        ),
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  const GETGroupMemberRequest = (provider) => {
    return provider
      .uponReceiving('a GET group member request with invalid auth')
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/groups\\/.*',
          '/ocs/v1.php/cloud/groups/' + config.username
        ),
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  it('checking method : getGroups', async () => {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await groupsRequest(provider, 'GET')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)

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

    await capabilitiesGETRequestInvalidAuth(provider)
    await groupsRequest(provider, 'POST')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)

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

    await capabilitiesGETRequestInvalidAuth(provider)
    await groupsRequest(provider, 'GET')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)

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

    await capabilitiesGETRequestInvalidAuth(provider)
    await DELETEGroupRequest(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)

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

    await capabilitiesGETRequestInvalidAuth(provider)
    await GETGroupMemberRequest(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)

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
