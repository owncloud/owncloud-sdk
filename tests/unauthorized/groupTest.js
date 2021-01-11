describe('Unauthorized: Currently testing group management,', function () {
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
    capabilitiesGETRequestInvalidAuth,
    pactCleanup,
    createOwncloud
  } = require('../pactHelper.js')

  beforeAll(function () {
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
