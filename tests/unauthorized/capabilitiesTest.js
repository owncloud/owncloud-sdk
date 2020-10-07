fdescribe('Unauthorized: Currently testing getConfig, getVersion and getCapabilities', function () {
  const OwnCloud = require('../../src')
  const config = require('../config/config.json')
  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions, origin, invalidAuthHeader } = require('../pactHelper.js')

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

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password + new Date().getTime()
        }
      }
    })

    oc.login()
  })

  fit('checking method : getCapabilities', function (done) {
    oc.getCapabilities().then(capabilities => {
      expect(capabilities).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })
})
