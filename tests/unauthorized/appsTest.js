describe('Unauthorized: Currently testing apps management,', function () {
  // CURRENT TIME
  const timeRightNow = new Date().getTime()
  const OwnCloud = require('../../src')
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
    capabilitiesGETRequestInvalidAuth
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
  beforeAll(function (done) {
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
    Promise.all(promises).then(done, done.fail)
  })

  afterAll(async function (done) {
    await provider.verify()
    provider.removeInteractions().then(done, done.fail)
  })

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password + timeRightNow
        }
      }
    })

    oc.login()
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
