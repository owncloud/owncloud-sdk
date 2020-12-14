describe('Main: Currently testing low level OCS', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions, validAuthHeaders } = require('./pactHelper.js')
  beforeAll(function (done) {
    Promise.all(setGeneralInteractions(provider)).then(done, done.fail)
  })

  afterAll(function (done) {
    provider.removeInteractions().then(done, done.fail)
  })

  beforeEach(function (done) {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password
        }
      }
    })

    oc.login().then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  afterEach(function () {
    oc.logout()
    oc = null
  })

  it('checking : capabilities', function (done) {
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

    const testUser = config.testUser
    oc.users.createUser(testUser, testUser).then(() => {
      return oc.requests.ocs({
        method: 'PUT',
        service: 'cloud',
        action: 'users/' + testUser,
        data: { key: 'email', value: 'foo@bar.net' }
      })
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
