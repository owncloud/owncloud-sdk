fdescribe('Main: Currently testing Login and initLibrary,', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // CURRENT TIME
  var timeRightNow = Math.random().toString(36).substr(2, 9)

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var nonExistentUser = 'nonExistentUser' + timeRightNow

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions, invalidAuthHeader } = require('./pactHelper.js')

  beforeEach(function () {
    oc = null
  })
  beforeAll(function (done) {
    const promises = []
    promises.push(setGeneralInteractions(provider))
    promises.push(provider.addInteraction({
      uponReceiving: 'a capabilities GET request with invalid authentication',
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/capabilities',
          generate: '/ocs/v1.php/cloud/capabilities'
        }),
        query: 'format=json',
        headers: {
          authorization: invalidAuthHeader,
          Origin: origin
        }
      },
      willRespondWith: {
        status: 401,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': origin
        },
        body: {
          ocs: {
            meta: {
              status: 'failure',
              statuscode: 997,
              message: 'Unauthorised'
            }
          }
        }
      }
    }))
    Promise.all(promises).then(done, done.fail)
  })
  afterAll(function (done) {
    provider.removeInteractions().then(done, done.fail)
  })
  it('checking method : initLibrary to be null', function () {
    expect(oc).toBe(null)
  })

  it('checking method : initLibrary', function () {
    oc = new OwnCloud()

    expect(oc).not.toBe(null)
  })

  it('checking method : login with a non existent instance URL', function () {
    try {
      oc = new OwnCloud({
        baseUrl: 'someRandomName'
      })
      fail('constructor will throw an exception if an invalid URL is passed in')
    } catch (error) {
      expect(error).not.toBe(null)
    }
  })

  it('checking method : login with wrong config.username and config.password', function (done) {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: nonExistentUser,
          password: 'config.password' + timeRightNow
        }
      }
    })

    oc.login().then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : login with correct config.username only', function (done) {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: 'config.password' + timeRightNow
        }
      }
    })

    oc.login().then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : login with correct config.username and config.password', function (done) {
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
      fail(error)
      done()
    })
  })
})
