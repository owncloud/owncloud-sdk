describe('Unauthorized: Currently testing apps management,', function () {
  // CURRENT TIME
  const timeRightNow = new Date().getTime()
  const config = require('../config/config.json')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    invalidAuthHeader,
    unauthorizedXmlResponseBody,
    CORSPreflightRequest,
    capabilitiesGETRequestInvalidAuth,
    pactCleanup,
    createOwncloud
  } = require('../pactHelper.js')
  const unauthorizedResponseObject = {
    status: 401,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Access-Control-Allow-Origin': origin
    },
    body: unauthorizedXmlResponseBody
  }
  const invalidAuthHeaderObject = {
    authorization: invalidAuthHeader,
    Origin: origin
  }
  beforeAll(function () {
    const promises = []
    promises.push(provider.addInteraction(CORSPreflightRequest()))
    promises.push(provider.addInteraction(capabilitiesGETRequestInvalidAuth()))
    const requiredAppMethods = ['GET', 'POST', 'DELETE']
    requiredAppMethods.forEach((method) => {
      promises.push(provider.addInteraction({
        uponReceiving: `an ${method} app request with invalid auth`,
        withRequest: {
          method: method,
          path: Pact.Matchers.regex({
            matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/apps.*',
            generate: '/ocs/v1.php/cloud/apps'
          }),
          headers: invalidAuthHeaderObject
        },
        willRespondWith: unauthorizedResponseObject
      }))
    })
    return Promise.all(promises)
  })

  afterAll(function () {
    return pactCleanup(provider)
  })

  beforeEach(function () {
    oc = createOwncloud(config.username, config.password + timeRightNow)

    return oc.login().then(() => {
      fail('not expected to log in')
    }).catch((err) => {
      if (err !== 'Unauthorized') {
        throw new Error(err)
      }
    })
  })

  it('checking method : getApps', function (done) {
    oc.apps.getApps().then(apps => {
      expect(apps).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : enableApp when app exists', function (done) {
    oc.apps.enableApp('files').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : disableApp', function (done) {
    oc.apps.disableApp('files').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })
})
