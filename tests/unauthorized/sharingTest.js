describe('Unauthorized: Currently testing file/folder sharing,', function () {
  const config = require('../config/config.json')
  var timeRightNow = new Date().getTime()

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    invalidAuthHeader,
    accessControlAllowHeaders,
    accessControlAllowMethods,
    unauthorizedXmlResponseBody,
    CORSPreflightRequest,
    capabilitiesGETRequestInvalidAuth,
    pactCleanup,
    createOwncloud
  } = require('../pactHelper.js')

  const unauthorizedResponseXml = {
    status: 401,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': accessControlAllowHeaders,
      'Access-Control-Allow-Methods': accessControlAllowMethods
    },
    body: unauthorizedXmlResponseBody
  }

  beforeAll(function () {
    const url = Pact.Matchers.term({
      matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares.*',
      generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
    })
    const promises = []
    promises.push(provider.addInteraction(CORSPreflightRequest()))
    promises.push(provider.addInteraction(capabilitiesGETRequestInvalidAuth()))
    const requiredMethodsArray = ['POST', 'GET', 'DELETE']
    requiredMethodsArray.forEach(method => {
      promises.push(provider.addInteraction({
        uponReceiving: `a share ${method} request of a file with invalid auth`,
        withRequest: {
          method: method,
          path: url,
          headers: {
            authorization: invalidAuthHeader,
            Origin: origin
          }
        },
        willRespondWith: unauthorizedResponseXml
      }))
    })
    return Promise.all(promises)
  })

  afterAll(function () {
    return pactCleanup(provider)
  })

  // TESTING CONFIGS
  const {
    testUser,
    testFile,
    testFolder,
    testGroup,
    nonExistentFile
  } = config

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

  it('checking method : shareFileWithLink', function (done) {
    oc.shares.shareFileWithLink(testFile).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : shareFileWithUser', function (done) {
    oc.shares.shareFileWithUser(testFile, testUser).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : shareFileWithGroup', function (done) {
    oc.shares.shareFileWithGroup(testFile, testGroup, {
      permissions: 19
    }).then(share => {
      expect(share).toEqual(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : isShared', function (done) {
    oc.shares.isShared(nonExistentFile).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : getShare', function (done) {
    oc.shares.getShare(1).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : getShares', function (done) {
    oc.shares.getShares(1).then(shares => {
      expect(shares).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : updateShare', function (done) {
    oc.shares.shareFileWithLink(testFolder).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })

  it('checking method : deleteShare', function (done) {
    oc.shares.deleteShare(123).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorized')
      done()
    })
  })
})
