// TODO: Review all matchers in xml once the issue is fixed
//
// https://github.com/pact-foundation/pact-js/issues/632
import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing file versions management,', function () {
  const config = require('./config/config.json')
  const {
    testUser1: { username: testUser, password: testUserPassword }
  } = require('./config/users.json')

  const {
    applicationXmlResponseHeaders,
    xmlResponseHeaders,
    textPlainResponseHeaders,
    getCurrentUserInformationInteraction,
    getCapabilitiesInteraction,
    createOwncloud,
    createProvider,
    getAuthHeaders,
    getMockServerBaseUrl
  } = require('./helpers/pactHelper.js')

  const mockServerBaseUrl = getMockServerBaseUrl()
  const { createDavPath } = require('./helpers/webdavHelper.js')
  // TESTING CONFIGS
  const versionedFile = config.testFile
  const fileInfo = {
    id: 12345678,
    versions: [
      {
        versionId: 98765432,
        content: 'update content'
      },
      {
        versionId: 87654321,
        content: '*'
      }
    ],
    versionResponseContent: [
      'update content',
      config.testContent
    ]
  }

  const propfindFileVersionsResponse = (node, version, contentLength) => {
    return node.appendElement('d:response', '', dResponse => {
      dResponse.appendElement('d:href', '', MatchersV3.regex(
        '.*\\/remote\\.php\\/dav\\/meta\\/.*\\/v\\/.*',
        `/remote.php/dav/meta/${fileInfo.id}/v/${fileInfo.versions[version].versionId}`)
      )
        .appendElement('d:propstat', '', dPropstat => {
          dPropstat.appendElement('d:prop', '', dProp => {
            dProp
              .appendElement('d:getlastmodified', '', MatchersV3.date('E, dd MM yyyy HH:mm:ss Z', 'Thu, 08 Oct 2020 02:28:50 GMT'))
              .appendElement('d:getcontentlength', '', MatchersV3.equal(contentLength))
              .appendElement('d:resourcetype', '', MatchersV3.equal(''))
              .appendElement('d:getetag', '', MatchersV3.string('&quot;bc7012325dcc9899be7da7cabfdddb00&quot;'))
              .appendElement('d:getcontenttype', '', MatchersV3.equal('text/plain'))
          })
            .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
        }).appendElement('d:propstat', '', dPropstat => {
          dPropstat.appendElement('d:prop', '', dProp => {
            dProp
              .appendElement('d:quota-used-bytes', '', '')
              .appendElement('d:quota-available-bytes', '', '')
          }).appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 404 Not Found'))
        })
    })
  }

  describe('file versions of non existing file', () => {
    it('retrieves file versions of not existing file', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, testUser, testUserPassword)
      await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
      await provider
        .given('the user is recreated', {
          username: testUser,
          password: testUserPassword
        })
        .uponReceiving(`as '${testUser}', a PROPFIND request to get file versions of non existent file`)
        .withRequest({
          method: 'PROPFIND',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/meta\\/42\\/v',
            '/remote.php/dav/meta/42/v'
          ),
          headers: { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
          body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
            dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            dPropfind.appendElement('d:prop', '', '')
          })
        })
        .willRespondWith({
          status: 404,
          headers: xmlResponseHeaders,
          body: new XmlBuilder('1.0', 'utf-8', 'd:error').build(dError => {
            dError.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:s': 'http://sabredav.org/ns' })
            dError.appendElement('s:exception', '', MatchersV3.equal('Sabre\\DAV\\Exception\\NotFound'))
              .appendElement('s:message', '', '')
          })
        })
      return provider.executeTest(async () => {
        const oc = createOwncloud(testUser, testUserPassword)
        await oc.login()
        return oc.fileVersions.listVersions(42).then(versions => {
          expect(versions).toBe(null)
        }).catch(error => {
          expect(error.statusCode).toBe(404)
          expect(error.message).toBe('')
        })
      })
    })
  })

  describe('file versions for existing files', () => {
    const PropfindFileVersionOfExistentFiles = provider => {
      return provider.given('the user is recreated', {
        username: testUser,
        password: testUserPassword
      })
        .given('file exists', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword
        })
        .given('the client waits', { delay: 2000 })
      // re-upload the same file to create a new version
        .given('file exists', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword,
          content: fileInfo.versions[0].content
        })
        .given('the client waits', { delay: 2000 })
        .given('file exists', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword,
          content: fileInfo.versions[1].content
        })
        .given('the client waits', { delay: 2000 })
        .given('file version link is returned', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword,
          number: 1
        })
        .uponReceiving(`as '${testUser}', a PROPFIND request to get file versions of existent file`)
        .withRequest({
          method: 'PROPFIND',
          path: MatchersV3.fromProviderState(
            '/remote.php/dav/meta/${fileId}/v', /* eslint-disable-line no-template-curly-in-string */
            `/remote.php/dav/meta/${fileInfo.id}/v`
          ),
          headers: { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
          body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
            dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            dPropfind.appendElement('d:prop', '', '')
          })
        })
        .willRespondWith({
          status: 207,
          headers: applicationXmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            const node = dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', MatchersV3.regex('.*\\/remote\\.php\\/dav\\/meta\\/.*\\/v$', `/remote.php/dav/meta/${fileInfo.id}/v/`))
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp
                      .appendElement('d:resourcetype', '', dResourceType => {
                        dResourceType.appendElement('d:collection', '', '')
                      })
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            })
            propfindFileVersionsResponse(node, 1, 14)
            propfindFileVersionsResponse(node, 0, 6)
          })
        })
    }
    const getFileVersionContents = async (provider, i) => {
      await provider.given('the user is recreated', {
        username: testUser,
        password: testUserPassword
      }).given('file exists', {
        fileName: versionedFile,
        username: testUser,
        password: testUserPassword
      })
        .given('the client waits', { delay: 2000 })
        .given('file exists', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword,
          content: fileInfo.versions[0].content
        })
        .given('the client waits', { delay: 2000 })
        .given('file exists', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword,
          content: fileInfo.versions[1].content
        })
        .given('the client waits', { delay: 2000 })
        .given('file version link is returned', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword,
          number: i + 1
        })
      await provider
        .uponReceiving(`as '${testUser}', a GET request to get file version ${i} contents`)
        .withRequest({
          method: 'GET',
          path: MatchersV3.fromProviderState(
            '\${versionLink}', // eslint-disable-line no-useless-escape,no-template-curly-in-string
              `/remote.php/dav/meta/${fileInfo.id}/v/${fileInfo.versions[i].versionId}`
          ),
          headers: { authorization: getAuthHeaders(testUser, testUserPassword) }
        })
        .willRespondWith({
          status: 200,
          body: fileInfo.versionResponseContent[i],
          headers: textPlainResponseHeaders
        })
    }

    it('checking method: getFileVersionUrl', function () {
      const oc = createOwncloud()
      const url = oc.fileVersions.getFileVersionUrl(666, 123456)
      expect(url).toBe(mockServerBaseUrl + 'remote.php/dav/meta/666/v/123456')
    })

    it('retrieves file versions', async function () {
      // TODO: move this loop to a single provider test
      // https://github.com/pact-foundation/pact-js/issues/604
      for (let i = 0; i < fileInfo.versions.length; i++) {
        const provider = createProvider(true, true)
        await getCapabilitiesInteraction(provider, testUser, testUserPassword)
        await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
        await PropfindFileVersionOfExistentFiles(provider)
        await getFileVersionContents(provider, i)

        await provider.executeTest(async () => {
          const oc = createOwncloud(testUser, testUserPassword)
          await oc.login()
          await oc.fileVersions.listVersions(fileInfo.id).then(versions => {
            expect(versions.length).toEqual(2)
            expect(versions[0].getSize()).toEqual(14)
            expect(versions[1].getSize()).toEqual(6)
          })
          await oc.fileVersions.getFileVersionContents(fileInfo.id, fileInfo.versions[i].versionId).then(content => {
            expect(content).toBe(fileInfo.versionResponseContent[i])
          })
        })
      }
    })

    it('restore file version', async function () {
      const destinationWebDavPath = createDavPath(testUser, versionedFile)
      const provider = createProvider()
      await getCapabilitiesInteraction(provider, testUser, testUserPassword)
      await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
      await provider
        .given('the user is recreated', {
          username: testUser,
          password: testUserPassword
        })
        .given('file exists', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword
        })
        // re-upload the same file to create a new version
        .given('file exists', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword
        })
        .given('file version link is returned', {
          fileName: versionedFile,
          username: testUser,
          password: testUserPassword,
          number: 1
        })
        .given('provider base url is returned')

      await provider
        .uponReceiving(`as '${testUser}', a COPY request to restore file versions`)
        .withRequest({
          method: 'COPY',
          path: MatchersV3.fromProviderState(
            '\${versionLink}', // eslint-disable-line no-useless-escape,no-template-curly-in-string
            `/remote.php/dav/meta/${fileInfo.id}/v/${fileInfo.versions[0].versionId}`
          ),
          headers: {
            authorization: getAuthHeaders(testUser, testUserPassword),
            Destination: MatchersV3.fromProviderState(
              `\${providerBaseURL}/remote.php/dav/${destinationWebDavPath}`,
              `${mockServerBaseUrl}${destinationWebDavPath}`
            )
          }
        })
        .willRespondWith({
          status: 204
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(testUser, testUserPassword)
        await oc.login()
        return oc.fileVersions.restoreFileVersion(fileInfo.id, fileInfo.versions[0].versionId, versionedFile).then(status => {
          expect(status).toBe(true)
        }).catch(reason => {
          fail(reason)
        })
      })
    })
  })
})
