import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Main: Currently testing low level OCS', function () {
  const config = require('./config/config.json')

  const {
    capabilitiesGETRequestValidAuth,
    GETRequestToCloudUserEndpoint,
    validAuthHeaders,
    GETSingleUserEndpoint,
    createOwncloud,
    createProvider,
    origin
  } = require('./pactHelper.js')

  it('checking : capabilities', async function () {
    const provider = createProvider()
    await capabilitiesGETRequestValidAuth(provider)
    await GETRequestToCloudUserEndpoint(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.requests.ocs({
        service: 'cloud',
        action: 'capabilities'
      })
        .then(function (response) {
          expect(response.ok).toBe(true)
          return response.json()
        })
        .then(json => {
          const capabilities = json.ocs.data
          expect(capabilities).not.toBe(null)
          expect(typeof (capabilities)).toBe('object')

          // Files App is never disabled
          expect(capabilities.capabilities.files).not.toBe(null)
          expect(capabilities.capabilities.files).not.toBe(undefined)
        }).catch(error => {
          fail(error)
        })
    })
  })

  it('checking : error behavior', async function () {
    const provider = createProvider()
    await capabilitiesGETRequestValidAuth(provider)
    await GETRequestToCloudUserEndpoint(provider)

    await provider
      .uponReceiving('an update request for an unknown user')
      .withRequest({
        method: 'PUT',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/unknown-user$',
          '/ocs/v2.php/cloud/users/unknown-user'
        ),
        query: { format: 'json' },
        headers: validAuthHeaders
      })
      .willRespondWith({
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': origin
        },
        body: {
          ocs: {
            meta: {
              statuscode: 997
            }
          }
        }
      })
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.requests.ocs({
        method: 'PUT',
        service: 'cloud',
        action: 'users/unknown-user',
        data: { key: 'display', value: 'Alice' }
      }).then(response => {
        expect(response.ok).toBe(false)
        expect(response.status).toBe(401)
        return response.json()
      }).then(json => {
        expect(json.ocs.meta.statuscode).toBe(997)
      }).catch(error => {
        fail(error)
      })
    })
  })

  it('checking : PUT email', async function (done) {
    const provider = createProvider()
    await capabilitiesGETRequestValidAuth(provider)
    await GETRequestToCloudUserEndpoint(provider)
    await GETSingleUserEndpoint(provider)
    await provider
      .uponReceiving('an update user request that sets email')
      .given(setup => {
        return 'my state'
      })
      .withRequest({
        method: 'PUT',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/.+',
          '/ocs/v1.php/cloud/users/' + config.testUser
        ),
        query: { format: 'json' },
        headers: validAuthHeaders,
        body: {
          key: 'email',
          value: 'foo@bar.net'
        }
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin
        },
        body: {
          ocs: {
            meta: {
              status: 'ok',
              statuscode: 200,
              message: null
            },
            data: []
          }
        }
      })

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      const testUser = config.testUser
      return oc.requests.ocs({
        method: 'PUT',
        service: 'cloud',
        action: 'users/' + testUser,
        data: { key: 'email', value: 'foo@bar.net' }
      }).then(response => {
        expect(response.ok).toBe(true)
        expect(response.status).toBe(200)
        return response.json()
      }).then(json => {
        expect(json.ocs.meta.statuscode).toBe(200)
        return oc.requests.ocs({
          service: 'cloud',
          action: 'users/' + testUser
        })
      }).then(response => {
        expect(response.ok).toBe(true)
        expect(response.status).toBe(200)
        return response.json()
      }).then(json => {
        expect(json.ocs.data.email).toBe('foo@bar.net')
        done()
      }).catch(error => {
        fail(error)
        done()
      })
    })
  })
})
