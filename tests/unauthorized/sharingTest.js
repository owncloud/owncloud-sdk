const { MatchersV3 } = require('@pact-foundation/pact/v3')

describe('Unauthorized: Currently testing file/folder sharing,', function () {
  const config = require('../config/config.json')

  const {
    invalidAuthHeader,
    unauthorizedXmlResponseBody,
    capabilitiesGETRequestInvalidAuth,
    createOwncloud,
    createProvider
  } = require('../pactHelper.js')

  // TESTING CONFIGS
  const {
    testUser,
    testFile,
    testGroup,
    username,
    invalidPassword
  } = config

  const invalidAuthHeaderObject = {
    authorization: invalidAuthHeader
  }

  const unauthorizedResponseObject = {
    status: 401,
    headers: {
      'Content-Type': 'application/xml;charset=utf-8'
    },
    body: unauthorizedXmlResponseBody
  }

  const aPOSTShareRequest = (provider, requestName) => {
    return provider
      .uponReceiving(requestName)
      .withRequest({
        method: 'POST',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        ),
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  const aGETShareRequest = (provider, requestName, path) => {
    return provider
      .uponReceiving(requestName)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        ),
        query: { path: `/${path}` },
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  const requestOnAShare = (provider, requestName, method) => {
    return provider
      .uponReceiving(requestName)
      .withRequest({
        method: method,
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares/1$',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares/1'
        ),
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  it('checking method : shareFileWithLink', async () => {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await aPOSTShareRequest(provider, 'a link share POST request with invalid auth')

    return provider.executeTest(async () => {
      const oc = createOwncloud(username, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.shares.shareFileWithLink(testFile).then(share => {
        expect(share).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : shareFileWithUser', async () => {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await aPOSTShareRequest(provider, 'a user share POST request with invalid auth')

    return provider.executeTest(async () => {
      const oc = createOwncloud(username, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.shares.shareFileWithUser(testFile, testUser).then(share => {
        expect(share).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : shareFileWithGroup', async () => {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await aPOSTShareRequest(provider, 'a group share POST request with invalid auth')

    return provider.executeTest(async () => {
      const oc = createOwncloud(username, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.shares.shareFileWithGroup(testFile, testGroup, {
        permissions: 19
      }).then(share => {
        expect(share).toEqual(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : isShared', async () => {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await aGETShareRequest(provider, 'a GET request to get share info of a share with invalid auth', testFile)

    return provider.executeTest(async () => {
      const oc = createOwncloud(username, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.shares.isShared(testFile).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getShare', async () => {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await requestOnAShare(provider, 'a GET request to get a share with invalid auth', 'GET')

    return provider.executeTest(async () => {
      const oc = createOwncloud(username, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.shares.getShare(1).then(share => {
        expect(share).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getShares', async () => {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await aGETShareRequest(provider, 'a GET request for existent shares with invalid auth', testFile)

    return provider.executeTest(async () => {
      const oc = createOwncloud(username, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.shares.getShares(testFile).then(shares => {
        expect(shares).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : updateShare', async () => {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await requestOnAShare(provider, 'a PUT request to update a share with invalid auth', 'PUT')

    return provider.executeTest(async () => {
      const oc = createOwncloud(username, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.shares.updateShare(1).then(share => {
        expect(share).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : deleteShare', async () => {
    const provider = createProvider()

    await capabilitiesGETRequestInvalidAuth(provider)
    await requestOnAShare(provider, 'a DELETE request to delete a share with invalid auth', 'DELETE')

    return provider.executeTest(async () => {
      const oc = createOwncloud(username, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.shares.deleteShare(1).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })
})
