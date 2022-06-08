import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Main: Currently testing low level OCS', function () {
  const config = require('./config/config.json')
  const username = config.adminUsername

  const {
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    validAdminAuthHeaders,
    createOwncloud,
    createProvider
  } = require('./helpers/pactHelper.js')

  it('checking : capabilities', async function () {
    const provider = createProvider(false, false)
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

  /*
    Remove this comment after the issue has been resolved

    Request to edit non-existing user by authorized (admin) user
    sends statuscode 401 (unauthorized)
    https://github.com/owncloud/core/issues/38423
  */
  it('checking : error behavior', async function () {
    const provider = createProvider(true, true)
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
        status: 404,
        body: {
          ocs: {
            meta: {
              statuscode: 404
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
        expect(response.status).toBe(404)
        return response.json()
      }).then(json => {
        expect(json.ocs.meta.statuscode).toBe(404)
      }).catch(error => {
        fail(error)
      })
    })
  })

  /*
    [oCIS] Using JSON data as content-type in any request responds with `400` bad request
    https://github.com/owncloud/ocis/issues/1702
  */
  it('checking : PUT email', async function () {
    const { testUser, testUserPassword } = config
    const provider = createProvider(false, true)
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
      }).catch(error => {
        fail(error)
      })
    })
  })
})
