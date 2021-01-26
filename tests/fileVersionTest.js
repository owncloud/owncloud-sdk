// TODO: Unskip the tests after the issue is fixed
// https://github.com/owncloud/owncloud-sdk/issues/705
import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing file versions management,', function () {
  const config = require('./config/config.json')

  const {
    validAuthHeaders,
    accessControlAllowHeaders,
    accessControlAllowMethods,
    applicationXmlResponseHeaders,
    getContentsOfFile,
    GETRequestToCloudUserEndpoint,
    capabilitiesGETRequestValidAuth,
    createOwncloud,
    createProvider
  } = require('./pactHelper.js')

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
    headers: validAuthHeaders,
    body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
      dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
      dPropfind.appendElement('d:prop', '', '')
    })
  }

  const header = {
    ...applicationXmlResponseHeaders,
    'Access-Control-Allow-Headers': accessControlAllowHeaders,
    'Access-Control-Allow-Methods': accessControlAllowMethods
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

  const fileVersionPath = version => MatchersV3.regex({
    matcher: `.*\\/remote\\.php\\/dav\\/meta\\/${fileInfo.id}\\/v\\/${fileInfo.versions[version].versionId}$`,
    generate: `/remote.php/dav/meta/${fileInfo.id}/v/${fileInfo.versions[version].versionId}`
  })

  describe.skip('file versions of non existing file', () => {
    it('retrieves file versions of not existing file', async function () {
      const provider = createProvider()
      await capabilitiesGETRequestValidAuth(provider)
      await GETRequestToCloudUserEndpoint(provider)
      await provider
        .uponReceiving('PROPFIND file versions of non existent file')
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
        .uponReceiving('PROPFIND file versions of existent file')
        .withRequest(propfindFileVersionsRequestData)
        .willRespondWith({
          status: 207,
          headers: header,
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
          .uponReceiving('GET file version contents')
          .withRequest({
            method: 'GET',
            path: fileVersionPath(i),
            headers: validAuthHeaders
          })
          .willRespondWith({
            status: 200,
            headers: header,
            body: fileInfo.versions[i].content
          })
      }
    }

    const restoreFileVersion = provider => {
      return provider
        .uponReceiving('Restore file versions')
        .withRequest({
          method: 'COPY',
          path: fileVersionPath(0),
          headers: validAuthHeaders
        })
        .willRespondWith({
          status: 204,
          headers: header
        })
    }

    it('checking method: getFileVersionUrl', function () {
      const oc = createOwncloud()
      const url = oc.fileVersions.getFileVersionUrl(666, 123456)
      expect(url).toBe(config.owncloudURL + 'remote.php/dav/meta/666/v/123456')
    })

    it.skip('retrieves file versions', async function () {
      const provider = createProvider()
      await capabilitiesGETRequestValidAuth(provider)
      await GETRequestToCloudUserEndpoint(provider)
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

    it.skip('restore file version', async function (done) {
      const provider = createProvider()
      await capabilitiesGETRequestValidAuth(provider)
      await GETRequestToCloudUserEndpoint(provider)
      await provider.addInteraction(getContentsOfFile(versionedFile))
      await PropfindFileVersionOfExistentFiles(provider)
      await getFileVersionContents(provider)
      await restoreFileVersion(provider)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.fileVersions.listVersions(fileInfo.id).then(versions => {
          expect(versions.length).toEqual(2)
          expect(versions[0].getSize()).toEqual(2)
          expect(versions[1].getSize()).toEqual(1)
          oc.fileVersions.restoreFileVersion(fileInfo.id, fileInfo.versions[0].versionId, versionedFile).then(status => {
            expect(status).toBe(true)
            oc.files.getFileContents(versionedFile).then(content => {
              expect(content).toBe(fileInfo.versions[0].content)
              done()
            })
          }).catch(reason => {
            fail(reason)
            done()
          })
        })
      })
    })
  })
})
