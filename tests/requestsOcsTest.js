import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Main: Currently testing low level OCS', function () {
  const config = require('./config/config.json')
  const username = config.adminUsername

  const {
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    validAdminAuthHeaders,
    getUserInformationAsAdminInteraction,
    createOwncloud,
    createProvider
  } = require('./pactHelper.js')

  it('checking : capabilities', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)

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
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)

    await provider
      .uponReceiving(`as '${username}', a PUT request to update an unknown user using OCS`)
      .withRequest({
        method: 'PUT',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v2\\.php\\/cloud\\/users\\/unknown-user$',
          '/ocs/v2.php/cloud/users/unknown-user'
        ),
        query: { format: 'json' },
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 401,
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
    const { testUser, testUserPassword } = config
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await provider
      .given('the user is recreated', { username: testUser, password: testUserPassword })
      .uponReceiving(`as '${username}', a PUT request to update a user using OCS`)
      .withRequest({
        method: 'PUT',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v2\\.php\\/cloud\\/users\\/.+',
          '/ocs/v2.php/cloud/users/' + testUser
        ),
        query: { format: 'json' },
        headers: {
          ...validAdminAuthHeaders,
          'content-type': 'application/json'
        },
        body: {
          key: 'email',
          value: 'foo@bar.net'
        }
      })
      .willRespondWith({
        status: 200,
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
    await getUserInformationAsAdminInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
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
