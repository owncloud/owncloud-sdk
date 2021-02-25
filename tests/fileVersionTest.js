// TODO: Unskip the tests after the issue is fixed
// https://github.com/owncloud/owncloud-sdk/issues/705
import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing file versions management,', function () {
  const config = require('./config/config.json')
  const username = config.adminUsername

  const {
    validAdminAuthHeaders,
    applicationXmlResponseHeaders,
    getCurrentUserInformationInteraction,
    getCapabilitiesInteraction,
    createOwncloud,
    createProvider,
    getAuthHeaders
  } = require('./pactHelper.js')

  const { createDavPath } = require('./webdavHelper.js')
  // TESTING CONFIGS
  const versionedFile = config.testFile
  const fileInfo = {
    id: 12345678,
    versions: [
      {
        versionId: 98765432,
        content: config.testContent
      },
      {
        versionId: 87654321,
        content: '*'
      }
    ]
  }
  const propfindFileVersionsRequestData = {
    method: 'PROPFIND',
    path: MatchersV3.regex({
      matcher: `.*\\/remote\\.php\\/dav\\/meta\\/${fileInfo.id}\\/v$`,
      generate: `/remote.php/dav/meta/${fileInfo.id}/v`
    }),
    headers: validAdminAuthHeaders,
    body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
      dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
      dPropfind.appendElement('d:prop', '', '')
    })
  }

  const propfindFileVersionsResponse = (node, version, contentLength) => {
    return node.appendElement('d:response', '', dResponse => {
      dResponse.appendElement('d:href', '', `/remote.php/dav/meta/${fileInfo.id}/v/${fileInfo.versions[version].versionId}`)
        .appendElement('d:propstat', '', dPropstat => {
          dPropstat.appendElement('d:prop', '', dProp => {
            dProp
              .appendElement('d:getlastmodified', '', 'Thu, 08 Oct 2020 02:28:50 GMT')
              .appendElement('d:getcontentlength', '', contentLength)
              .appendElement('d:resourcetype', '', '')
              .appendElement('d:getetag', '', '&quot;bc7012325dcc9899be7da7cabfdddb00&quot;')
              .appendElement('d:getcontenttype', '', 'text/plain')
          })
            .appendElement('d:status', '', 'HTTP/1.1 200 OK')
        }).appendElement('d:propstat', '', dPropstat => {
          dPropstat.appendElement('d:prop', '', dProp => {
            dProp
              .appendElement('d:quota-used-bytes', '', '')
              .appendElement('d:quota-available-bytes', '', '')
          }).appendElement('d:status', '', 'HTTP/1.1 404 Not Found')
        })
    })
  }

  const fileVersionPath = (fileId, versionId) => MatchersV3.regex(
   `.*\\/remote\\.php\\/dav\\/meta\\/${fileId}\\/v\\/${versionId}$`,
   `/remote.php/dav/meta/${fileId}/v/${versionId}`
  )

  describe.skip('file versions of non existing file', () => {
    it('retrieves file versions of not existing file', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await provider
        .uponReceiving(`as '${username}', a PROPFIND request to get file versions of non existent file`)
        .withRequest(propfindFileVersionsRequestData)
        .willRespondWith({
          status: 404,
          headers: applicationXmlResponseHeaders,
          body: new XmlBuilder('1.0', 'utf-8', 'd:error').build(dError => {
            dError.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            dError.appendElement('d:exception', '', 'Sabre\\DAV\\Exception\\NotFound')
              .appendElement('s:message', '', '')
          })
        })
      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.fileVersions.listVersions(fileInfo.id).then(versions => {
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
      return provider
        .uponReceiving(`as '${username}', a PROPFIND request to get file versions of existent file`)
        .withRequest(propfindFileVersionsRequestData)
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
              dResponse.appendElement('d:href', '', `/remote.php/dav/meta/${fileInfo.id}/v/`)
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp
                      .appendElement('d:resourcetype', '', dResourceType => {
                        dResourceType.appendElement('d:collection', '', '')
                      })
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            })
            propfindFileVersionsResponse(node, 1, 2)
            propfindFileVersionsResponse(node, 0, 1)
          })
        })
    }
    const getFileVersionContents = async provider => {
      for (let i = 0; i < fileInfo.versions.length; i++) {
        await provider
          .uponReceiving(`as '${username}', a GET request to get file version contents`)
          .withRequest({
            method: 'GET',
            path: fileVersionPath(fileInfo.id, fileInfo.versions[i].versionId),
            headers: validAdminAuthHeaders
          })
          .willRespondWith({
            status: 200,
            body: fileInfo.versions[i].content
          })
      }
    }

    it('checking method: getFileVersionUrl', function () {
      const oc = createOwncloud()
      const url = oc.fileVersions.getFileVersionUrl(666, 123456)
      expect(url).toBe(config.owncloudURL + 'remote.php/dav/meta/666/v/123456')
    })

    it.skip('retrieves file versions', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await PropfindFileVersionOfExistentFiles(provider)
      await getFileVersionContents(provider)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        await oc.fileVersions.listVersions(fileInfo.id).then(versions => {
          expect(versions.length).toEqual(2)
          expect(versions[0].getSize()).toEqual(2)
          expect(versions[1].getSize()).toEqual(1)
        })
        await oc.fileVersions.getFileVersionContents(fileInfo.id, fileInfo.versions[0].versionId).then(content => {
          expect(content).toBe(fileInfo.versions[0].content)
        })
        return oc.fileVersions.getFileVersionContents(fileInfo.id, fileInfo.versions[1].versionId).then(content => {
          expect(content).toBe(fileInfo.versions[1].content)
        })
      })
    })

    it('restore file version', async function () {
      const destinationWebDavPath = createDavPath(config.testUser, versionedFile)
      const provider = createProvider()
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(provider, config.testUser, config.testUserPassword)
      provider
        .given('the user is recreated', {
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file exists', {
          fileName: versionedFile,
          username: config.testUser,
          password: config.testUserPassword
        })
        // re-upload the same file to create a new version
        .given('file exists', {
          fileName: versionedFile,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file version link is returned', {
          fileName: versionedFile,
          username: config.testUser,
          password: config.testUserPassword,
          number: 1
        })
        .given('provider base url is returned')
      provider
        .uponReceiving(`as '${username}', a COPY request to restore file versions`)
        .withRequest({
          method: 'COPY',
          path: MatchersV3.fromProviderState(
            // eslint-disable-next-line no-useless-escape,no-template-curly-in-string
            '\${versionLink}',
            `/remote.php/dav/meta/${fileInfo.id}/v/${fileInfo.versions[0].versionId}`
          ),
          headers: {
            authorization: getAuthHeaders(config.testUser, config.testUserPassword),
            Destination: MatchersV3.fromProviderState(
              `\${providerBaseURL}${destinationWebDavPath}`,
              `${config.owncloudURL}${destinationWebDavPath}`
            )
          }
        })
        .willRespondWith({
          status: 204
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
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
