describe('Signed urls', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { ocsMeta } = require('./pactHelper.js')
  const {
    accessControlAllowHeaders,
    accessControlAllowMethods,
    validAuthHeaders,
    origin,
    CORSPreflightRequest,
    capabilitiesGETRequestValidAuth,
    GETRequestToCloudUserEndpoint
  } = require('./pactHelper.js')

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

  beforeAll(async function (done) {
    const promises = []
    promises.push(provider.addInteraction(CORSPreflightRequest()))
    promises.push(provider.addInteraction(capabilitiesGETRequestValidAuth()))
    promises.push(provider.addInteraction(GETRequestToCloudUserEndpoint()))
    promises.push(provider.addInteraction({
      uponReceiving: 'a GET request for a signing key',
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/user\\/signing-key',
          generate: '/ocs/v1.php/cloud/user/signing-key'
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          'Access-Control-Allow-Methods': accessControlAllowMethods,
          'Content-Type': 'application/xml; charset=utf-8',
          'Access-Control-Allow-Origin': origin
        },
        body: '\n' +
          '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ocsMeta('ok', 100, 'OK') +
          ' <data>\n' +
          '  <user>admin</user>\n' +
          '  <signing-key>YONNpClEO2GVtTDqIwaVsgLBIuDSe03wFhdwcG1WmorRK/iE8xGs7HyHNseftgb3</signing-key>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    })
    )
    promises.push(provider.addInteraction({
      uponReceiving: 'a GET request for a file download using signed url',
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/remote\\.php\\/dav\\/files\\/admin\\/' + config.testFolder + '\\/' + config.testFile + '?.+$',
          generate: '/remote.php/dav/files/admin/' + config.testFolder + '/' + config.testFile + '?'
        })
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          'Access-Control-Allow-Methods': accessControlAllowMethods,
          'Content-Type': 'text/xml; charset=utf-8',
          'Access-Control-Allow-Origin': origin
        },
        body: config.testContent
      }
    })
    )
    Promise.all(promises).then(done, done.fail)
  }
  )

  afterAll(async function (done) {
    await provider.verify()
    provider.removeInteractions().then(done, done.fail)
  })

  it('should allow file download with a signUrl', async function (done) {
    const url = oc.files.getFileUrlV2(config.testFolder + '/' + config.testFile)
    const signedUrl = await oc.signUrl(url)
    const response = await fetch(signedUrl)
    expect(response.ok).toEqual(true)
    const txt = await response.text()
    expect(txt).toEqual(config.testContent)
    done()
  })
})
