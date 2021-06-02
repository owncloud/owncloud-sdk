import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing getConfig, getVersion and getCapabilities', () => {
  let oc
  const { adminUsername: username } = require('./config/config.json')

  const {
    createProvider,
    createOwncloud,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    validAdminAuthHeaders,
    xmlResponseHeaders
  } = require('./helpers/pactHelper.js')

  it('checking method : getConfig', async () => {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await provider
      .uponReceiving(`as '${username}', a GET request to get server config`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          /.*\/ocs\/v1\.php\/config/,
          '/ocs/v1.php/config'
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            meta.appendElement('status', '', MatchersV3.equal('ok'))
              .appendElement('statuscode', '', MatchersV3.equal('100'))
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
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
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
