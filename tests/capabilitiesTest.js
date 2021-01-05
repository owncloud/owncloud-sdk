describe('Main: Currently testing getConfig, getVersion and getCapabilities', function () {
  let oc
  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    capabilitiesGETRequestValidAuth,
    CORSPreflightRequest,
    GETRequestToCloudUserEndpoint,
    validAuthHeaders,
    xmlResponseHeaders,
    ocsMeta,
    createOwncloud
  } = require('./pactHelper.js')

  beforeAll(function (done) {
    const promises = []
    promises.push(provider.addInteraction(CORSPreflightRequest()))
    Promise.all(promises).then(done, done.fail)
  })

  beforeEach(function (done) {
    const promises = []
    promises.push(provider.addInteraction(capabilitiesGETRequestValidAuth()))
    promises.push(provider.addInteraction(GETRequestToCloudUserEndpoint()))
    Promise.all(promises).then(done, done.fail)
  })

  afterEach(async function (done) {
    oc.logout()
    oc = null
    await provider.verify()
    provider.removeInteractions().then(done, done.fail)
  })

  it('checking method : getConfig', async function (done) {
    oc = await createOwncloud()
    await provider.addInteraction({
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
    })
    oc.getConfig().then(config => {
      expect(config).not.toBe(null)
      expect(typeof (config)).toBe('object')
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })

  it('checking method : getCapabilities', async function (done) {
    oc = await createOwncloud()
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
