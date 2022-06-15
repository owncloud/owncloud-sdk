import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Signed urls', function () {
  var config = require('./config/config.json')
  const {
    testUser1: { username: testUser, password: testUserPassword }
  } = require('./config/users.json')

  const fetch = require('node-fetch')
  const {
    ocsMeta,
    xmlResponseHeaders,
    textPlainResponseHeaders,
    createOwncloud,
    getAuthHeaders,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createProvider
  } = require('./helpers/pactHelper.js')

  const getSigningKeyInteraction = (provider, username, password) => {
    return provider
      .given('the user is recreated', { username: username, password: password })
      .uponReceiving(`as '${username}', a GET request to get a signing key`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/user\\/signing-key',
          '/ocs/v1.php/cloud/user/signing-key'
        ),
        headers: {
          authorization: getAuthHeaders(username, password)
        }
      }).willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', 'OK')
          })
            .appendElement('data', '', (data) => {
              data.appendElement('user', '', MatchersV3.string(username))
                .appendElement('signing-key', '',
                  MatchersV3.regex('(?:^[a-zA-Z0-9\\/\\+]+)$',
                    'YONNpClEO2GVtTDqIwaVsgLBIuDSe03wFhdwcG1WmorRK/iE8xGs7HyHNseftgb3'))
            })
        })
      })
  }

  const downloadWithSignedURLInteraction = async (provider, username, password) => {
    await provider
      .given('file exists', {
        fileName: `${config.testFolder}/${config.testFile}`,
        username: username,
        password: password
      })
      .given('signed-key is returned', {
        username: username,
        password: password,
        path: `${config.testFolder}/${config.testFile}`
      })
    return provider
      .uponReceiving(`as '${username}', a GET request to download a file using signed url`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/remote\\.php\\/dav\\/files\\/' + username + '\\/' + config.testFolder + '\\/' + config.testFile + '?.+$',
          '/remote.php/dav/files/' + username + '/' + config.testFolder + '/' + config.testFile + '?'
        ),
        query: {
          'OC-Verb': 'GET',
          'OC-Algo': 'PBKDF2/10000-SHA512',
          // eslint-disable-next-line no-template-curly-in-string
          'OC-Signature': MatchersV3.fromProviderState('${hashedKey}',
            '481af3539853a2032d750b57901988b194c6b47d883710f3359dc7e58a3518cb'),
          'OC-Credential': username,
          'OC-Expires': '1200',
          // eslint-disable-next-line no-template-curly-in-string
          'OC-Date': MatchersV3.fromProviderState('${date}', '2021-01-19T02:54:22.486Z')
        }
      }).willRespondWith({
        status: 200,
        headers: textPlainResponseHeaders,
        body: config.testContent
      })
  }

  it('should allow file download with a signUrl', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider, testUser, testUserPassword)
    // eslint-disable-next-line no-sequences
    await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
    await getSigningKeyInteraction(provider, testUser, testUserPassword)
    await downloadWithSignedURLInteraction(provider, testUser, testUserPassword)

    return provider.executeTest(async () => {
      const oc = createOwncloud(testUser, testUserPassword)
      await oc.login()

      const url = oc.files.getFileUrl(`files/${testUser}/${config.testFolder}/${config.testFile}`)
      const signedUrl = await oc.signUrl(url)
      const response = await fetch(signedUrl)
      expect(response.ok).toEqual(true)
      const txt = await response.text()
      expect(txt).toEqual(config.testContent)
    })
  })
})
