import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing apps management,', function () {
  const config = require('../config/config.json')
  const { admin: { username: adminUsername } } = require('../config/users.json')

  const {
    unauthorizedXmlResponseBody,
    createOwncloud,
    createProvider,
    getCapabilitiesWithInvalidAuthInteraction,
    invalidAuthHeader,
    xmlResponseHeaders
  } = require('../helpers/pactHelper.js')

  const unauthorizedResponseObject = {
    status: 401,
    headers: xmlResponseHeaders,
    body: unauthorizedXmlResponseBody
  }

  const invalidAuthHeaderObject = {
    authorization: invalidAuthHeader
  }

  const getAppsInvalidAuthInteraction = async (provider, query) => {
    return provider
      .uponReceiving(`as '${adminUsername}', a GET request to get all apps with invalid auth`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/apps$',
          '/ocs/v1.php/cloud/apps'
        ),
        query: query,
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  const appRequestInvalidAuthInteraction = async (provider, requestName, method, app) => {
    return provider
      .uponReceiving(`as '${adminUsername}', a ${method} request to ${requestName} with invalid auth`)
      .withRequest({
        method: method,
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/apps\\/.*',
          `/ocs/v1.php/cloud/apps/${app}`
        ),
        headers: invalidAuthHeaderObject
      })
      .willRespondWith(unauthorizedResponseObject)
  }

  it('checking method : getApps', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await getAppsInvalidAuthInteraction(provider)
    await getAppsInvalidAuthInteraction(provider, { filter: 'enabled' })

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.apps.getApps().then(apps => {
        expect(apps).toBe(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : enableApp when app exists', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await appRequestInvalidAuthInteraction(provider, 'enable app', 'POST', 'files')

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.apps.enableApp('files').then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : disableApp', async function (done) {
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await appRequestInvalidAuthInteraction(provider, 'disable app', 'DELETE', 'files')

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err.message).toBe('Unauthorized')
      })

      return oc.apps.disableApp('files').then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.message).toMatch('Unauthorized')
        done()
      })
    })
  })
})
