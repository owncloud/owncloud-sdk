fdescribe('Main: Currently testing getConfig, getVersion and getCapabilities', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions, validAuthHeaders, xmlResponseHeaders, ocsMeta } = require('./pactHelper.js')

  beforeAll(function (done) {
    const promises = []
    promises.push(setGeneralInteractions(provider))
    promises.push(provider.addInteraction({
      uponReceiving: 'GET config request',
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/config',
          generate: '/ocs/v1.php/config'
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: xmlResponseHeaders,
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ocsMeta('ok', '100') +
          ' <data>\n' +
          '  <version>1.7</version>\n' +
          '  <website>ownCloud</website>\n' +
          '  <host>localhost</host>\n' +
          '  <contact></contact>\n' +
          '  <ssl>false</ssl>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    }))
    Promise.all(promises).then(done, done.fail)
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
      fail(error)
      done()
    })
  })

  afterEach(function () {
    oc.logout()
    oc = null
  })

  it('checking method : getConfig', function (done) {
    oc.getConfig().then(config => {
      expect(config).not.toBe(null)
      expect(typeof (config)).toBe('object')
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })

  it('checking method : getCapabilities', function (done) {
    oc.getCapabilities().then(capabilities => {
      expect(capabilities).not.toBe(null)
      expect(typeof (capabilities)).toBe('object')

      // Files App is never disabled
      expect(capabilities.capabilities.files).not.toBe(null)
      expect(capabilities.capabilities.files).not.toBe(undefined)

      // Big file chunking of files app is always on
      expect(capabilities.capabilities.files.bigfilechunking).toEqual(true)
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })
})
