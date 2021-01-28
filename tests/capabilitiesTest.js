import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing getConfig, getVersion and getCapabilities', () => {
  let oc

  const {
    createProvider,
    createOwncloud,
    capabilitiesGETRequestValidAuth,
    GETRequestToCloudUserEndpoint,
    validAuthHeaders,
    xmlResponseHeaders
  } = require('./pactHelper.js')

  it('checking method : getConfig', async () => {
    const provider = createProvider()
    await capabilitiesGETRequestValidAuth(provider)
    await GETRequestToCloudUserEndpoint(provider)
    await provider
      .uponReceiving('GET config request')
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          /.*\/ocs\/v(1|2)\.php\/config/,
          '/ocs/v1.php/config'
        ),
        headers: validAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            meta.appendElement('status', '', 'ok')
              .appendElement('statuscode', '', '100')
          }).appendElement('data', '', (data) => {
            data.appendElement('version', '', MatchersV3.decimal(1.7))
          })
        })
      })
    await provider.executeTest(async () => {
      oc = createOwncloud()
      await oc.login()
      return oc.getConfig().then(config => {
        expect(config).not.toBe(null)
        expect(typeof (config)).toBe('object')
      }).catch(error => {
        fail(error)
      })
    })
  })

  it('checking method : getCapabilities', async () => {
    const provider = createProvider()
    await capabilitiesGETRequestValidAuth(provider)
    await GETRequestToCloudUserEndpoint(provider)
    await provider.executeTest(async () => {
      oc = createOwncloud()
      await oc.login()
      return oc.getCapabilities().then(capabilities => {
        expect(capabilities).not.toBe(null)
        expect(typeof (capabilities)).toBe('object')
        // Files App is never disabled
        expect(capabilities.capabilities.files).not.toBe(null)
        expect(capabilities.capabilities.files).not.toBe(undefined)
        // Big file chunking of files app is always on
        expect(capabilities.capabilities.files.bigfilechunking).toEqual(true)
      }).catch(error => {
        fail(error)
      })
    })
  })
})
