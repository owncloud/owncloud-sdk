import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Signed urls', function () {
  var config = require('./config/config.json')
  const username = config.adminUsername

  const fetch = require('node-fetch')
  const {
    ocsMeta,
    createOwncloud,
    accessControlAllowHeaders,
    accessControlAllowMethods,
    validAdminAuthHeaders,
    origin,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createProvider
  } = require('./pactHelper.js')

  const getSigningKeyInteraction = (provider) => {
    return provider
      .uponReceiving(`as '${username}', a GET request to get a signing key`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/user\\/signing-key',
          '/ocs/v1.php/cloud/user/signing-key'
        ),
        headers: validAdminAuthHeaders
      }).willRespondWith({
        status: 200,
        headers: {
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          'Access-Control-Allow-Methods': accessControlAllowMethods,
          'Content-Type': 'application/xml; charset=utf-8',
          'Access-Control-Allow-Origin': origin
        },
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', 'OK')
          })
            .appendElement('data', '', (data) => {
              data.appendElement('user', '', config.adminUsername)
                .appendElement('signing-key', '', 'YONNpClEO2GVtTDqIwaVsgLBIuDSe03wFhdwcG1WmorRK/iE8xGs7HyHNseftgb3')
            })
        })
      })
  }

  const downloadWithSignedURLInteraction = (provider) => {
    return provider
      .uponReceiving(`as '${username}', a GET request to download a file using signed url`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/remote\\.php\\/dav\\/files\\/' + config.adminUsername + '\\/' + config.testFolder + '\\/' + config.testFile + '?.+$',
          '/remote.php/dav/files/' + config.adminUsername + '/' + config.testFolder + '/' + config.testFile + '?'
        ),
        query: {
          'OC-Verb': 'GET',
          'OC-Algo': 'PBKDF2/10000-SHA512',
          'OC-Signature': MatchersV3.regex('[a-f0-9]+', '481af3539853a2032d750b57901988b194c6b47d883710f3359dc7e58a3518cb'),
          'OC-Credential': config.adminUsername,
          'OC-Expires': '1200',
          'OC-Date': MatchersV3.regex('[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z', '2021-01-19T02:54:22.486Z')
        }
      }).willRespondWith({
        status: 200,
        headers: {
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          'Access-Control-Allow-Methods': accessControlAllowMethods,
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': origin
        },
        body: config.testContent
      })
  }

  it('should allow file download with a signUrl', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getSigningKeyInteraction(provider)
    await downloadWithSignedURLInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()

      const url = oc.files.getFileUrlV2(config.testFolder + '/' + config.testFile)
      const signedUrl = await oc.signUrl(url)
      const response = await fetch(signedUrl)
      expect(response.ok).toEqual(true)
      const txt = await response.text()
      expect(txt).toEqual(config.testContent)
    })
  })
})
