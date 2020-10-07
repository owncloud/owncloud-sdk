fdescribe('Unauthorized: Currently testing apps management,', function () {
  // CURRENT TIME
  const timeRightNow = new Date().getTime()
  const OwnCloud = require('../../src')
  const config = require('../config/config.json')

  // LIBRARY INSTANCE
  let oc

  // TEST setup
  const key = ['attr1', 'attr%2Bplus%20space', '%C3%A5%C2%B1%C2%9E%C3%A6%C2%80%C2%A71']
  const value = ['value1', 'value%2Bplus+space+and%2Fslash', '%C3%A5%C2%80%C2%BC%C3%A5%C2%AF%C2%B91']
  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions, invalidAuthHeader, unauthorizedXmlResponseBody } = require('../pactHelper.js')
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
    promises.push(setGeneralInteractions(provider))
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
    const requiredAttributesMethodsArray = ['GET', 'POST']
    requiredAttributesMethodsArray.forEach((method) => {
      promises.push(provider.addInteraction({
        uponReceiving: `a ${method} request for attributes with invalid authorization`,
        withRequest: {
          method: method,
          path: Pact.Matchers.regex({
            matcher: '.*\\/ocs\\/v(1|2)\\.php\\/privatedata\\/.*',
            generate: '/ocs/v1.php/privatedata/attribute/' + config.testApp
          }),
          headers: invalidAuthHeaderObject
        },
        willRespondWith: unauthorizedResponseObject
      }))
    })
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
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : setAttribute', function (done) {
    let count = 0

    for (let i = 0; i < key.length; i++) {
      oc.apps.setAttribute(config.testApp, key[i], value[i]).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error).toMatch('Unauthorised')
        count++
        if (count === key.length) {
          done()
        }
      })
    }
  })

  it('checking method : getAttribute', function (done) {
    let count = 0

    for (let i = 0; i < key.length; i++) {
      oc.apps.getAttribute(config.testApp, key[i]).then(data => {
        expect(data).toBe(null)
        done()
      }).catch(error => {
        expect(error).toMatch('Unauthorised')
        count++
        if (count === key.length) {
          done()
        }
      })
    }
  })

  it('checking method : deleteAttribute', function (done) {
    let count = 0

    for (let i = 0; i < key.length; i++) {
      oc.apps.deleteAttribute(config.testApp, key[i]).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error).toMatch('Unauthorised')
        count++
        if (count === key.length) {
          done()
        }
      })
    }
  })

  it('checking method : enableApp when app exists', function (done) {
    oc.apps.enableApp('files').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : disableApp', function (done) {
    oc.apps.disableApp('files').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })
})
