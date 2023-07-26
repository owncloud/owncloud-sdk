// [oCIS] HTTP 401 Unauthorized responses don't contain a body
// https://github.com/owncloud/ocis/issues/1293

const { MatchersV3 } = require('@pact-foundation/pact/v3')

describe('Unauthorized: Currently testing file/folder sharing,', function () {
  const {
    testFile,
    testGroup,
    invalidPassword
  } = require('../config/config.json')
  const {
    admin: { username: adminUsername },
    testUser1: { username: testUser }
  } = require('../config/users.json')

  const {
    invalidAuthHeader,
    unauthorizedXmlResponseBody,
    getCapabilitiesWithInvalidAuthInteraction,
    createOwncloud,
    createProvider
  } = require('../helpers/pactHelper.js')

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

  const createShareInteraction = (provider, requestName) => {
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

  const getSharesInteraction = (provider, requestName, path) => {
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

  const getShareInteraction = (provider, requestName, method) => {
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
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await createShareInteraction(provider, `as '${adminUsername}', a POST request to create public link share with invalid auth`)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.shares.shareFileWithLink(testFile).then(share => {
        expect(share).toBe(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : shareFileWithUser', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await createShareInteraction(provider, `as '${adminUsername}', a POST request to share a file to a user with invalid auth`)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.shares.shareFileWithUser(testFile, testUser).then(share => {
        expect(share).toBe(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : shareFileWithGroup', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await createShareInteraction(provider, `as '${adminUsername}', a POST request to share a file to a group with invalid auth`)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.shares.shareFileWithGroup(testFile, testGroup, {
        permissions: 19
      }).then(share => {
        expect(share).toEqual(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : isShared', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await getSharesInteraction(provider, `as '${adminUsername}', a GET request to check whether a file is shared or not with invalid auth`, testFile)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.shares.isShared(testFile).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getShare', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await getShareInteraction(provider, `as '${adminUsername}', a GET request to get single share of a file with invalid auth`, 'GET')

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.shares.getShare(1).then(share => {
        expect(share).toBe(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : getShares', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await getSharesInteraction(provider, `as '${adminUsername}', a GET request to get shares of a file with invalid auth`, testFile)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.shares.getShares(testFile).then(shares => {
        expect(shares).toBe(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : updateShare', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await getShareInteraction(provider, `as '${adminUsername}', a PUT request to update a share with invalid auth`, 'PUT')

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.shares.updateShare(1).then(share => {
        expect(share).toBe(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : deleteShare', async () => {
    const provider = createProvider(false, true)

    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await getShareInteraction(provider, `as '${adminUsername}', a DELETE request to delete a share with invalid auth`, 'DELETE')

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.shares.deleteShare(1).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })
})
