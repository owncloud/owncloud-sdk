import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing apps management,', function () {
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

  const getAppsInvalidAuthInteraction = async (provider, query) => {
    return provider
      .uponReceiving('an GET app request with invalid auth')
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

  const appRequestInvalidAuthInteraction = async (provider, method, app) => {
    return provider
      .uponReceiving(`an ${method} app request with invalid auth`)
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
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await getAppsInvalidAuthInteraction(provider)
    await getAppsInvalidAuthInteraction(provider, { filter: 'enabled' })

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.apps.getApps().then(apps => {
        expect(apps).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : enableApp when app exists', async function () {
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await appRequestInvalidAuthInteraction(provider, 'POST', 'files')

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.apps.enableApp('files').then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
      })
    })
  })

  it('checking method : disableApp', async function (done) {
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await appRequestInvalidAuthInteraction(provider, 'DELETE', 'files')

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.apps.disableApp('files').then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
        done()
      })
    })
  })
})
