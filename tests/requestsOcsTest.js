describe('Main: Currently testing low level OCS', function () {
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    capabilitiesGETRequestValidAuth,
    CORSPreflightRequest,
    GETRequestToCloudUserEndpoint,
    validAuthHeaders,
    GETSingleUserEndpoint,
    createOwncloud,
    pactCleanup
  } = require('./pactHelper.js')

  beforeAll(function () {
    const promises = []
    promises.push(provider.addInteraction(capabilitiesGETRequestValidAuth()))
    promises.push(provider.addInteraction(GETRequestToCloudUserEndpoint()))
    promises.push(provider.addInteraction(CORSPreflightRequest()))
    return Promise.all(promises)
  })

  afterEach(function () {
    oc.logout()
    oc = null
  })

  afterAll(function () {
    return pactCleanup(provider)
  })

  it('checking : capabilities', async function (done) {
    oc = await createOwncloud()
    oc.requests.ocs({
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

        done()
      }).catch(error => {
        fail(error)
        done()
      })
  })

  it('checking : error behavior', async function (done) {
    oc = await createOwncloud()
    await provider.addInteraction({
      uponReceiving: 'an update request for an unknown user',
      withRequest: {
        method: 'PUT',
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/unknown-user$',
          generate: '/ocs/v2.php/cloud/users/unknown-user'
        }),
        query: 'format=json',
        headers: validAuthHeaders
      },
      willRespondWith: {
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
      }
    })

    oc.requests.ocs({
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
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })

  it('checking : PUT email', async function (done) {
    oc = await createOwncloud()
    await provider.addInteraction({
      uponReceiving: 'an update user request that sets email',
      given (providerState) {
        return 'my state'
      },
      withRequest: {
        method: 'PUT',
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/.+',
          generate: '/ocs/v1.php/cloud/users/' + config.testUser
        }),
        query: 'format=json',
        headers: validAuthHeaders,
        body: {
          key: 'email',
          value: 'foo@bar.net'
        }
      },
      willRespondWith: {
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
      }
    })
    await provider.addInteraction(GETSingleUserEndpoint())

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
