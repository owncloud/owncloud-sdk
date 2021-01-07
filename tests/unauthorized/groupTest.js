describe('Unauthorized: Currently testing group management,', function () {
  var OwnCloud = require('../../src')
  var config = require('../config/config.json')

  // CURRENT TIME
  var timeRightNow = new Date().getTime()

  // LIBRARY INSTANCE
  var oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    invalidAuthHeader,
    unauthorizedXmlResponseBody,
    origin,
    CORSPreflightRequest,
    capabilitiesGETRequestInvalidAuth
  } = require('../pactHelper.js')

  beforeAll(function (done) {
    const promises = []
    promises.push(provider.addInteraction(CORSPreflightRequest()))
    promises.push(provider.addInteraction(capabilitiesGETRequestInvalidAuth()))
    const requiredAttributesForGroupInteractions = ['GET', 'POST', 'DELETE']
    requiredAttributesForGroupInteractions.forEach(method => {
      promises.push(provider.addInteraction({
        uponReceiving: `a group ${method} request with invalid auth`,
        withRequest: {
          method: method,
          path: Pact.Matchers.term({
            matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups.*',
            generate: '/ocs/v1.php/cloud/groups/' + config.testGroup
          }),
          headers: {
            authorization: invalidAuthHeader,
            Origin: origin
          }
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'Access-Control-Allow-Origin': origin
          },
          body: unauthorizedXmlResponseBody
        }
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

  it('checking method : createGroup', function (done) {
    oc.groups.createGroup('newGroup' + timeRightNow).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : getGroups', function (done) {
    oc.groups.getGroups().then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : groupExists', function (done) {
    oc.groups.groupExists('admin').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : getGroupMembers', function (done) {
    oc.groups.getGroupMembers('admin').then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : deleteGroup', function (done) {
    oc.groups.deleteGroup(config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })
})
