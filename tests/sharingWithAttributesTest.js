import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('oc.shares', function () {
  const config = require('./config/config.json')

  const {
    validAuthHeaders,
    applicationXmlResponseHeaders,
    ocsMeta,
    shareResponseOcsData,
    capabilitiesGETRequestValidAuth,
    GETRequestToCloudUserEndpoint,
    createOwncloud,
    createProvider
  } = require('./pactHelper.js')

  // TESTING CONFIGS
  const { testUser, testFile } = config
  const shareAttributes = {
    attributes: [
      { scope: 'ownCloud', key: 'read', value: 'true' },
      { scope: 'ownCloud', key: 'share', value: 'true' }
    ]
  }

  const shareAttributesResponse = () => {
    const response = []
    for (let i = 0; i < shareAttributes.attributes.length; i++) {
      response.push(`{
      &quot;scope&quot;:&quot;${shareAttributes.attributes[i].scope}&quot;,
      &quot;key&quot;:&quot;${shareAttributes.attributes[i].key}&quot;,
      &quot;enabled&quot;:&quot;${shareAttributes.attributes[i].value}&quot;
      }`)
    }
    return response
  }

  const sharingWithAttributes = (provider) => {
    return provider
      .uponReceiving('Share with permissions in attributes')
      .withRequest({
        method: 'POST',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        ),
        headers: validAuthHeaders
        // TODO: uncomment this line once the issue is fixed
        // https://github.com/pact-foundation/pact-js/issues/577

        // body: `shareType=0&shareWith=${testUser}&path=%2F${testFile}&attributes%5B0%5D%5Bscope%5D=${shareAttributes.attributes[0].scope}&attributes%5B0%5D%5Bkey%5D=${shareAttributes.attributes[0].key}&attributes%5B0%5D%5Bvalue%5D=${shareAttributes.attributes[0].value}&attributes%5B1%5D%5Bscope%5D=${shareAttributes.attributes[1].scope}&attributes%5B1%5D%5Bkey%5D=${shareAttributes.attributes[1].key}&attributes%5B1%5D%5Bvalue%5D=${shareAttributes.attributes[1].value}`
      })
      .willRespondWith({
        status: 200,
        headers: applicationXmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          })
            .appendElement('data', '', (data) => {
              shareResponseOcsData(data, 0, 7, 17, testFile)
                .appendElement('share_with', '', testUser)
                .appendElement('share_with_displayname', '', testUser)
                .appendElement('attributes', '', shareAttributesResponse())
            })
        })
      })
  }

  it('shall share with permissions in attributes', async function () {
    const provider = createProvider()
    await capabilitiesGETRequestValidAuth(provider)
    await GETRequestToCloudUserEndpoint(provider)
    await sharingWithAttributes(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.shares.shareFileWithUser(testFile, testUser, shareAttributes).then(share => {
        expect(share.getPermissions()).toBe(17)
      })
    })
  })
})
