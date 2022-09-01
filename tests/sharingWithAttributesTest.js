import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('oc.shares', function () {
  const { testFile } = require('./config/config.json')
  const {
    testUser1: { username: sharer, password: sharerPassword },
    testUser2: { username: receiver }
  } = require('./config/users.json')

  const {
    xmlResponseHeaders,
    applicationFormUrlEncodedContentType,
    ocsMeta,
    shareResponseOcsData,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createOwncloud,
    createProvider,
    getAuthHeaders
  } = require('./helpers/pactHelper.js')

  const {
    givenFileExists,
    givenUserExists
  } = require('./helpers/providerStateHelper')

  const shareAttributes = {
    attributes: [
      { scope: 'ownCloud', key: 'read', value: 'true' },
      { scope: 'ownCloud', key: 'share', value: 'true' }
    ]
  }

  const shareAttributesResponse = () => {
    const response = []
    for (let i = 0; i < shareAttributes.attributes.length; i++) {
      response.push('{"scope":"' + shareAttributes.attributes[i].scope + '","key":"' + shareAttributes.attributes[i].key + '",' +
        '"enabled":"' + shareAttributes.attributes[i].value + '"}')
    }
    return `[${response}]`
  }

  const sharingWithAttributes = async (provider) => {
    await givenUserExists(provider, sharer)
    await givenUserExists(provider, receiver)
    await givenFileExists(provider, sharer, testFile, 'a test file')
    return provider
      .uponReceiving(`as '${sharer}', a POST request to share a file with permissions in attributes`)
      .withRequest({
        method: 'POST',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        ),
        headers: {
          authorization: getAuthHeaders(sharer, sharerPassword),
          ...applicationFormUrlEncodedContentType
        },
        body: 'shareType=0&shareWith=' + receiver + '&path=%2F' + testFile +
          '&attributes%5B0%5D%5Bscope%5D=' + shareAttributes.attributes[0].scope +
          '&attributes%5B0%5D%5Bkey%5D=' + shareAttributes.attributes[0].key +
          '&attributes%5B0%5D%5Bvalue%5D=' + shareAttributes.attributes[0].value +
          '&attributes%5B1%5D%5Bscope%5D=' + shareAttributes.attributes[1].scope +
          '&attributes%5B1%5D%5Bkey%5D=' + shareAttributes.attributes[1].key +
          '&attributes%5B1%5D%5Bvalue%5D=' + shareAttributes.attributes[1].value
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
          })
            .appendElement('data', '', (data) => {
              shareResponseOcsData(data, 0, 7, 17, '/' + testFile)
                .appendElement('share_with', '', MatchersV3.equal(receiver))
                .appendElement('share_with_displayname', '', MatchersV3.equal(receiver))
                .appendElement('attributes', '', MatchersV3.equal(shareAttributesResponse()))
            })
        })
      })
  }

  it('shall share with permissions in attributes', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider, sharer, sharerPassword)
    await getCurrentUserInformationInteraction(provider, sharer, sharerPassword)
    await sharingWithAttributes(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(sharer, sharerPassword)
      await oc.login()
      return oc.shares.shareFileWithUser(testFile, receiver, shareAttributes).then(share => {
        expect(share.getPermissions()).toBe(17)
      })
    })
  })
})
