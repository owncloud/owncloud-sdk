import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('oc.shares', function () {
  const config = require('./config/config.json')

  const {
    xmlResponseHeaders,
    applicationFormUrlEncoded,
    ocsMeta,
    shareResponseOcsData,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createOwncloud,
    createProvider,
    getAuthHeaders
  } = require('./helpers/pactHelper.js')

  // TESTING CONFIGS
  const { testUser, testUserPassword, testFile } = config
  const shareAttributes = {
    attributes: [
      { scope: 'ownCloud', key: 'read', value: 'true' },
      { scope: 'ownCloud', key: 'share', value: 'true' }
    ]
  }
  const shareeName = config.testUser2
  const shareePassword = config.testUser2Password

  const shareAttributesResponse = () => {
    const response = []
    for (let i = 0; i < shareAttributes.attributes.length; i++) {
      response.push('{"scope":"' + shareAttributes.attributes[i].scope + '","key":"' + shareAttributes.attributes[i].key + '",' +
        '"enabled":"' + shareAttributes.attributes[i].value + '"}')
    }
    return `[${response}]`
  }

  const sharingWithAttributes = (provider) => {
    return provider
      .given('the user is recreated', { username: testUser, password: testUserPassword })
      .given('the user is recreated', { username: shareeName, password: shareePassword })
      .given('file exists', { username: testUser, password: testUserPassword, fileName: testFile, testContent: 'a test file' })
      .uponReceiving(`as '${testUser}', a POST request to share a file with permissions in attributes`)
      .withRequest({
        method: 'POST',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        ),
        headers: {
          authorization: getAuthHeaders(testUser, testUserPassword),
          ...applicationFormUrlEncoded
        },
        body: 'shareType=0&shareWith=' + shareeName + '&path=%2F' + testFile +
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
                .appendElement('share_with', '', shareeName)
                .appendElement('share_with_displayname', '', shareeName)
                .appendElement('attributes', '', shareAttributesResponse())
            })
        })
      })
  }

  it('shall share with permissions in attributes', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider, testUser, testUserPassword)
    await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
    await sharingWithAttributes(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(testUser, testUserPassword)
      await oc.login()
      return oc.shares.shareFileWithUser(testFile, shareeName, shareAttributes).then(share => {
        expect(share.getPermissions()).toBe(17)
      })
    })
  })
})
