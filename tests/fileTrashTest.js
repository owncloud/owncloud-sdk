// TODO: Review all matchers in xml once the issue is fixed
//
// https://github.com/pact-foundation/pact-js/issues/632
import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'
import path from 'path'

describe('oc.fileTrash', function () {
  const config = require('./config/config.json')
  const { testUser, testUserPassword } = config

  const trashEnabled = true

  const {
    getCurrentUserInformationInteraction,
    getCapabilitiesInteraction,
    createOwncloud,
    createProvider,
    applicationXmlResponseHeaders,
    getMockServerBaseUrl,
    getAuthHeaders,
    htmlResponseHeaders,
    webdavExceptionResponseBody
  } = require('./helpers/pactHelper.js')

  const mockServerBaseUrl = getMockServerBaseUrl()

  const deletedFolderId = '2147596415'
  const deletedFileId = '2147596419'

  const trashbinPath = MatchersV3.regex(
    '.*\\/remote\\.php\\/dav\\/trash-bin\\/' + testUser + '\\/$',
    '/remote.php/dav/trash-bin/' + testUser + '/'
  )

  const responseHeader = function (contentType) {
    return (
      {
        'Content-Type': contentType
      }
    )
  }

  const emptyTrashbinXmlRequestBody = new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
    dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
    dPropfind.appendElement('d:prop', '', dProp => {
      dProp
        .appendElement('oc:trashbin-original-filename', '', '')
        .appendElement('oc:trashbin-original-location', '', '')
        .appendElement('oc:trashbin-delete-timestamp', '', '')
        .appendElement('d:getcontentlength', '', '')
        .appendElement('d:resourcetype', '', '')
    })
  })

  const filesListXmlRequestBody = new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
    dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
    dPropfind.appendElement('d:prop', '', '')
  })

  // oCIS Issue - https://github.com/owncloud/ocis/issues/1846 - invalid root href
  // oCIS Issue - https://github.com/owncloud/ocis/issues/1847 - invalid datetime
  // oCIS Issue - https://github.com/owncloud/ocis/issues/1848 - invaalid root resourcetype
  const trashbinXmlResponseBody = function (emptyTrashbin = true, deletedFolderId = null) {
    const xmlResponseBody = (extraBody = null) => {
      return new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
        dMultistatus.setAttributes({
          'xmlns:d': 'DAV:',
          'xmlns:s': 'http://sabredav.org/ns',
          'xmlns:oc': 'http://owncloud.org/ns'
        })
        const body = dMultistatus.appendElement('d:response', '', dResponse => {
          dResponse.appendElement('d:href', '', '/remote.php/dav/trash-bin/' + testUser + '/')
            .appendElement('d:propstat', '', dPropstat => {
              dPropstat.appendElement('d:prop', '', dProp => {
                dProp
                  .appendElement('d:resourcetype', '', dResourceType => {
                    dResourceType.appendElement('d:collection', '', '')
                  })
              })
                .appendElement('d:status', '', 'HTTP/1.1 200 OK')
            }).appendElement('d:propstat', '', dPropstat => {
              dPropstat.appendElement('d:prop', '', dProp => {
                dProp
                  .appendElement('oc:trashbin-original-filename', '', '')
                  .appendElement('oc:trashbin-original-location', '', '')
                  .appendElement('oc:trashbin-delete-timestamp', '', '')
                  .appendElement('d:getcontentlength', '', '')
              })
                .appendElement('d:status', '', 'HTTP/1.1 404 Not Found')
            })
        })
        if (extraBody) {
          body.appendElement('d:response', '', extraBody)
        }
      })
    }

    if (emptyTrashbin) {
      return xmlResponseBody()
    } else {
      return xmlResponseBody(dResponse => {
        dResponse.appendElement('d:href', '', MatchersV3.regex(
          '.*remote\\.php\\/dav\\/trash-bin\\/' + testUser + '\\/\\d+\\/$',
          '/remote.php/dav/trash-bin/test123/2344455/'
        ))
          .appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('oc:trashbin-original-filename', '', 'testFolder')
                .appendElement('oc:trashbin-original-location', '', 'testFolder')
                .appendElement('oc:trashbin-delete-timestamp', '', MatchersV3.regex('\\d+', '1615955759'))
                .appendElement('d:resourcetype', '', dResourceType => {
                  dResourceType.appendElement('d:collection', '', '')
                })
            })
              .appendElement('d:status', '', 'HTTP/1.1 200 OK')
          }).appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('d:getcontentlength', '', '')
            })
              .appendElement('d:status', '', 'HTTP/1.1 404 Not Found')
          })
      })
    }
  }
  const requestMethod = function (method, path, headers, body = null) {
    return {
      method: method,
      path: path,
      headers: headers,
      body: body
    }
  }
  const responseMethod = function (status, headers = {}, body = null) {
    return {
      status: status,
      headers: headers,
      body: body
    }
  }

  describe('when deleting files and folders', function () {
    it('should have the trashbin capability set', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        if (!trashEnabled) {
          pending()
        }
        return oc.getCapabilities().then(cap => {
          expect(cap.capabilities.dav.trashbin).toEqual('1.0')
        }).catch(error => {
          fail(error)
        })
      })
    })
  })

  describe('and when empty', function () {
    it('should list no items ', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, testUser, testUserPassword)
      await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
      await provider
        .given('the user is recreated', {
          username: testUser,
          password: testUserPassword
        })
        .uponReceiving(`as '${testUser}', a PROPFIND request to list empty trash`)
        .withRequest(requestMethod(
          'PROPFIND',
          trashbinPath,
          { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
          emptyTrashbinXmlRequestBody
        )).willRespondWith({
          status: 207,
          headers: applicationXmlResponseHeaders,
          body: trashbinXmlResponseBody()
        })
      return provider.executeTest(async () => {
        const oc = createOwncloud(testUser, testUserPassword)
        await oc.login()
        if (!trashEnabled) {
          pending()
        }
        return oc.fileTrash.list('/').then(trashItems => {
          expect(trashItems.length).toEqual(1)
          expect(trashItems[0].getName()).toEqual(testUser)
        })
      })
    })
  })

  describe('when a folder is deleted', function () {
    const testFolder = config.testFolder
    const testFile = testFolder + '/' + config.testFile

    describe('and folder is not restored', function () {
      const propfindForTrashbinWithItems = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: testFile,
            username: testUser,
            password: testUserPassword
          })
          .given('resource is deleted', {
            resourcePath: testFolder,
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a PROPFIND request to list trashbin items`)
          .withRequest(requestMethod(
            'PROPFIND',
            MatchersV3.regex(
              '.*\\/remote\\.php\\/dav\\/trash-bin\\/' + testUser + '\\/$',
              '/remote.php/dav/trash-bin/' + testUser + '/'
            ),
            { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            emptyTrashbinXmlRequestBody
          )).willRespondWith(responseMethod(
            207,
            responseHeader('application/xml; charset=utf-8'),
            trashbinXmlResponseBody(false, deletedFolderId)
          ))
      }
      const listItemWithinADeletedFolder = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: testFile,
            username: testUser,
            password: testUserPassword
          })
          .given('resource is deleted', {
            resourcePath: testFolder,
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a PROPFIND request to list item within a deleted folder`)
          .withRequest(requestMethod(
            'PROPFIND',
            MatchersV3.fromProviderState(
              '/remote.php/dav/trash-bin/' + testUser + '/${trashId}', /* eslint-disable-line no-template-curly-in-string */
              `/remote.php/dav/trash-bin/${testUser}/${deletedFolderId}`
            ),
            { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            emptyTrashbinXmlRequestBody
          ))
          .willRespondWith({
            status: 207,
            headers: responseHeader('application/xml; charset=utf-8'),
            body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
              dMultistatus.setAttributes({
                'xmlns:d': 'DAV:',
                'xmlns:s': 'http://sabredav.org/ns',
                'xmlns:oc': 'http://owncloud.org/ns'
              })
              dMultistatus.appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', MatchersV3.regex(
                  '.*\\/remote\\.php\\/dav\\/trash-bin\\/' + testUser + '\\/d+$',
                  '/remote.php/dav/trash-bin/' + testUser + '/' + deletedFolderId
                ))
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('oc:trashbin-original-filename', '', 'testFolder')
                        .appendElement('oc:trashbin-original-location', '', 'testFolder')
                        .appendElement('oc:trashbin-delete-timestamp', '', MatchersV3.regex('\\d+', '1615955759'))
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  }).appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp.appendElement('d:getcontentlength')
                    }).appendElement('d:status', '', 'HTTP/1.1 404 Not Found')
                  })
              })
              dMultistatus.appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', MatchersV3.regex(
                  '.*\\/remote\\.php\\/dav\\/trash-bin\\/' + testUser + '\\/d+\\/d+$',
                  '/remote.php/dav/trash-bin/' + testUser + '/' + deletedFolderId + '/' + deletedFileId)
                )
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('oc:trashbin-original-filename', '', 'testFile.txt')
                        .appendElement('oc:trashbin-original-location', '', 'testFolder/testFile.txt')
                        .appendElement('oc:trashbin-delete-timestamp', '', MatchersV3.regex('\\d+', '1615955759'))
                        .appendElement('d:getcontentlength', '', '6')
                        .appendElement('d:resourcetype', '', '')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }

      it('should list a deleted folder', async function () {
        const provider = createProvider(true, true)
        await getCapabilitiesInteraction(provider, testUser, testUserPassword)
        await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
        await propfindForTrashbinWithItems(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud(testUser, testUserPassword)
          await oc.login()
          return oc.fileTrash.list('/').then(trashItems => {
            expect(trashItems.length).toEqual(2)
            expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFolder)
          })
        })
      })

      it('should list an item within a deleted folder', async function () {
        const provider = createProvider(true, true)
        await getCapabilitiesInteraction(provider, testUser, testUserPassword)
        await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
        await propfindForTrashbinWithItems(provider)
        await listItemWithinADeletedFolder(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud(testUser, testUserPassword)
          await oc.login()
          return oc.fileTrash.list('/').then(trashItems => {
            expect(trashItems.length).toEqual(2)
            expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFolder)
            expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-location')).toEqual(testFolder)
            return oc.fileTrash.list(trashItems[1].getName()).then(trashItems => {
              expect(trashItems.length).toEqual(2)
              expect(trashItems[0].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFolder)
              expect(trashItems[0].getProperty('{http://owncloud.org/ns}trashbin-original-location')).toEqual(testFolder)
              expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(config.testFile)
              expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-location')).toEqual(testFile)
            }).catch(error => {
              fail(error)
            })
          })
        })
      })
    })

    describe('and when this deleted folder is restored to its original location', function () {
      const originalLocation = testFolder
      const moveFolderFromTrashbinToFilesList = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: testFile,
            username: testUser,
            password: testUserPassword
          })
          .given('resource is deleted', {
            resourcePath: testFile,
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a MOVE request to restore folder from trashbin to fileslist to original location`)
          .withRequest({
            method: 'MOVE',
            path: MatchersV3.fromProviderState(
              `/remote.php/dav/trash-bin/${testUser}/\${trashId}`, /* eslint-disable-line no-template-curly-in-string */
              `/remote.php/dav/trash-bin/${testUser}/${deletedFolderId}`
            ),
            headers: {
              authorization: getAuthHeaders(testUser, testUserPassword),
              Destination: mockServerBaseUrl + 'remote.php/dav/files/' + testUser + '/' + config.testFolder
            }
          })
          .willRespondWith(responseMethod(
            204
          ))
      }

      const propfindForTrashbinWithItems = provider => {
        return provider
          .uponReceiving(`as '${testUser}', a PROPFIND request to list trashbin items`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinPath,
            { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            emptyTrashbinXmlRequestBody
          ))
          .willRespondWith(responseMethod(
            207,
            responseHeader('application/xml; charset=utf-8'),
            trashbinXmlResponseBody()
          ))
      }

      const propfindToARestoredFolderInOriginalLocation = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: testFile,
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a PROPFIND request to a restored folder in original location`)
          .withRequest({
            method: 'PROPFIND',
            path: MatchersV3.regex(
              '.*\\/remote\\.php\\/webdav\\/' + testFolder,
              '/remote.php/webdav/' + testFolder
            ),
            headers: { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            body: filesListXmlRequestBody
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
              dMultistatus.appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', `/remote.php/webdav/${testFolder}/`)
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('d:getlastmodified', '', MatchersV3.date('E, dd MM yyyy HH:mm:ss Z', 'Thu, 08 Oct 2020 02:28:50 GMT'))
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                        .appendElement('d:quota-used-bytes', '', '6')
                        .appendElement('d:quota-available-bytes', '', '-3')
                        .appendElement('d:getetag', '', MatchersV3.regex('[a-f0-9]+', '5f7ae781e8073'))
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }

      it('should list the folder in the original location and no longer in trash-bin', async function () {
        const provider = createProvider(true, true)
        await getCapabilitiesInteraction(provider, testUser, testUserPassword)
        await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
        await moveFolderFromTrashbinToFilesList(provider)
        await propfindForTrashbinWithItems(provider)
        await propfindToARestoredFolderInOriginalLocation(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud(testUser, testUserPassword)
          await oc.login()
          return oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
            return oc.fileTrash.list('/').then(trashItems => {
              expect(trashItems.length).toEqual(1)
              expect(trashItems[0].getName()).toEqual(testUser)
              return oc.files.fileInfo(testFolder).then(fileInfo => {
                expect(fileInfo.getName()).toEqual(testFolder)
              })
            }).catch(error => {
              fail(error)
            })
          })
        })
      })
    })

    describe('and when this deleted folder is restored to a different location', function () {
      const suffix = ' (restored to a different location)'
      const originalLocation = testFolder + suffix

      const MoveFromTrashbinToDifferentLocation = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .given('resource is deleted', {
            resourcePath: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a MOVE request to restore folder from trashbin to fileslist to a different location`)
          .withRequest({
            method: 'MOVE',
            path: MatchersV3.fromProviderState(
              `/remote.php/dav/trash-bin/${testUser}/\${trashId}`, /* eslint-disable-line no-template-curly-in-string */
              `/remote.php/dav/trash-bin/${testUser}/${deletedFolderId}`
            ),
            headers: {
              Destination: mockServerBaseUrl + 'remote.php/dav/files/' + testUser + '/' + config.testFolder + '%20(restored%20to%20a%20different%20location)',
              authorization: getAuthHeaders(testUser, testUserPassword)
            }
          })
          .willRespondWith(responseMethod(
            201,
            htmlResponseHeaders
          ))
      }

      const PropfindToAnEmptytrashbinAfterRestoring = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a PROPFIND request to an empty trashbin after restoring`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinPath,
            { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            emptyTrashbinXmlRequestBody
          ))
          .willRespondWith(responseMethod(
            207,
            applicationXmlResponseHeaders,
            trashbinXmlResponseBody()
          ))
      }

      const PropfindToARestoredFolderInNewLocation = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('folder exists', {
            folderName: originalLocation,
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a PROPFIND request to a restored folder in new location`)
          .withRequest({
            method: 'PROPFIND',
            path: MatchersV3.regex(
              '.*\\/remote\\.php\\/webdav\\/' + testFolder + '.*$',
              '/remote.php/webdav/' + testFolder + encodeURIComponent(suffix)
            ),
            headers: { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            body: filesListXmlRequestBody
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
              dMultistatus.appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', '/remote.php/webdav/' + testFolder + encodeURIComponent(suffix) + '/')
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('d:getlastmodified', '', MatchersV3.date('E, dd MM yyyy HH:mm:ss Z', 'Thu, 08 Oct 2020 02:28:50 GMT'))
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                        .appendElement('d:quota-used-bytes', '', '0')
                        .appendElement('d:quota-available-bytes', '', '-3')
                        .appendElement('d:getetag', '', MatchersV3.regex('[a-f0-9]', '5f7c5fdc06e47'))
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }
      it('should list the folder in the different location and no longer in trash-bin', async function () {
        const provider = createProvider(true, true)
        await getCapabilitiesInteraction(provider, testUser, testUserPassword)
        await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
        await MoveFromTrashbinToDifferentLocation(provider)
        await PropfindToAnEmptytrashbinAfterRestoring(provider)
        await PropfindToARestoredFolderInNewLocation(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud(testUser, testUserPassword)
          await oc.login()
          return oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
            return oc.fileTrash.list('/').then(trashItems => {
              expect(trashItems.length).toEqual(1)
              expect(trashItems[0].getName()).toEqual(testUser)
              return oc.files.fileInfo(originalLocation).then(fileInfo => {
                expect(fileInfo.getName()).toEqual(originalLocation)
              })
            }).catch(error => {
              fail(error)
            })
          })
        })
      })
    })
  })

  describe('when a file is deleted', function () {
    const testFolder = config.testFolder
    const testFile = config.testFile

    describe('and file is not restored', function () {
      const propfindTrashItemsBeforeDeletingFile = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('folder exists', {
            folderName: testFolder,
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .given('resource is deleted', {
            resourcePath: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a PROPFIND request to trash items before deleting file`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinPath,
            { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            emptyTrashbinXmlRequestBody
          ))
          .willRespondWith({
            status: 207,
            headers: applicationXmlResponseHeaders,
            body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
              dMultistatus.setAttributes({
                'xmlns:d': 'DAV:',
                'xmlns:s': 'http://sabredav.org/ns',
                'xmlns:oc': 'http://owncloud.org/ns'
              })
              dMultistatus.appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', '/remote.php/dav/trash-bin/' + testUser + '/')
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  }).appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('oc:trashbin-original-filename', '', '')
                        .appendElement('oc:trashbin-original-location', '', '')
                        .appendElement('oc:trashbin-delete-timestamp', '', '')
                        .appendElement('d:getcontentlength', '', '')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 404 Not Found')
                  })
              }).appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', MatchersV3.regex(
                  '.*\\/remote\\.php\\/dav\\/trash-bin\\/' + testUser + '\\/d+$',
                  '/remote.php/dav/trash-bin/' + testUser + '/' + deletedFileId
                ))
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('oc:trashbin-original-filename', '', testFile)
                        .appendElement('oc:trashbin-original-location', '', testFolder + '/' + testFile)
                        .appendElement('oc:trashbin-delete-timestamp', '', MatchersV3.regex('d+', '5f7c5fdc06e47'))
                        .appendElement('d:getcontentlength', '', '6')
                        .appendElement('d:resourcetype', '', '')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }

      it('should list the deleted file', async function () {
        const provider = createProvider(true, true)
        await getCapabilitiesInteraction(provider, testUser, testUserPassword)
        await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
        await propfindTrashItemsBeforeDeletingFile(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud(testUser, testUserPassword)
          await oc.login()
          if (!trashEnabled) {
            pending()
          }
          return oc.fileTrash.list('/').then(trashItems => {
            expect(trashItems.length).toEqual(2)
            expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFile)
            expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-location')).toEqual(`${testFolder}/${testFile}`)
          })
        })
      })
    })

    describe('and when this deleted file is restored to its original location', function () {
      const originalLocation = testFile
      const MoveFromTrashbinToDifferentLocation = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .given('resource is deleted', {
            resourcePath: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUserPassword}', a MOVE request to restore file from trashbin to fileslist to a different location`)
          .withRequest({
            method: 'MOVE',
            path: MatchersV3.fromProviderState(
              `/remote.php/dav/trash-bin/${testUser}/\${trashId}`,
              '/remote.php/dav/trash-bin/' + testUser + '/' + deletedFolderId
            ),
            headers: {
              Destination: mockServerBaseUrl + `remote.php/dav/files/${testUser}/${testFile}`,
              authorization: getAuthHeaders(testUser, testUserPassword)
            }
          })
          .willRespondWith({
            status: 201,
            headers: htmlResponseHeaders
          })
      }

      const propfindTrashItemsAfterRestoringDeletingFile = provider => {
        return provider
          .uponReceiving(`as '${testUser}', a PROPFIND request to trash items after restoring deleting file`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinPath,
            { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            emptyTrashbinXmlRequestBody
          ))
          .willRespondWith(responseMethod(207, responseHeader('application/xml; charset=utf-8'), trashbinXmlResponseBody()))
      }

      const propfindToARestoredFileInOriginalLocation = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a PROPFIND request to a restored file in original location`)
          .withRequest({
            method: 'PROPFIND',
            path: MatchersV3.regex(
              '.*\\/remote\\.php\\/webdav\\/' + testFolder + '.*$',
              '/remote.php/webdav/' + testFolder
            ),
            headers: { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            body: filesListXmlRequestBody
          })
          .willRespondWith({
            status: 207,
            headers: responseHeader('application/xml; charset=utf-8'),
            body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
              dMultistatus.setAttributes({
                'xmlns:d': 'DAV:',
                'xmlns:s': 'http://sabredav.org/ns',
                'xmlns:oc': 'http://owncloud.org/ns'
              })
              dMultistatus.appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', '/remote.php/webdav/' + testFolder + '/')
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('d:getlastmodified', '', MatchersV3.timestamp('EEE, dd MMM yyyy HH:mm:ss z', 'Tue, 06 Oct 2020 12:15:24 GMT'))
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                        .appendElement('d:quota-used-bytes', '', '6')
                        .appendElement('d:quota-available-bytes', '', '-3')
                        .appendElement('d:getetag', '', MatchersV3.regex('[a-f0-9]+', '5f7c5fdc06e47'))
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }

      it('should list the folder in the original location and no longer in trash-bin', async function () {
        const provider = createProvider(true, true)
        await getCapabilitiesInteraction(provider, testUser, testUserPassword)
        await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
        await MoveFromTrashbinToDifferentLocation(provider)
        await propfindTrashItemsAfterRestoringDeletingFile(provider)
        await propfindToARestoredFileInOriginalLocation(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud(testUser, testUserPassword)
          await oc.login()
          return oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
            return oc.fileTrash.list('/').then(trashItems => {
              expect(trashItems.length).toEqual(1)
              expect(trashItems[0].getName()).toEqual(testUser)
              return oc.files.fileInfo(testFolder).then(fileInfo => {
                expect(fileInfo.getName()).toEqual(testFolder)
              })
            }).catch(error => {
              fail(error)
            })
          })
        })
      })
    })

    describe('and when this deleted file is restored to a different location', function () {
      const originalLocation = 'file (restored to a different location).txt'

      const MoveFromTrashbinToDifferentLocation = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .given('resource is deleted', {
            resourcePath: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a MOVE request to restore file from trashbin to a new location`)
          .withRequest({
            method: 'MOVE',
            path: MatchersV3.fromProviderState(
              `/remote.php/dav/trash-bin/${testUser}/\${trashId}`,
              '/remote.php/dav/trash-bin/' + testUser + '/' + deletedFolderId
            ),
            headers: {
              authorization: getAuthHeaders(testUser, testUserPassword),
              Destination: mockServerBaseUrl + 'remote.php/dav/files/' + testUser + '/file%20(restored%20to%20a%20different%20location).txt'
            }
          })
          .willRespondWith({
            status: 201,
            headers: htmlResponseHeaders
          })
      }
      const propfindToARestoredFileInNewLocationEmpty = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: '/file (restored to a different location).txt',
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a PROPFIND request to trash items after restoring deleting file to new location`)
          .withRequest({
            method: 'PROPFIND',
            path: trashbinPath,
            headers: { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            body: emptyTrashbinXmlRequestBody
          })
          .willRespondWith({
            status: 207,
            headers: responseHeader('application/xml; charset=utf-8'),
            body: trashbinXmlResponseBody()
          })
      }

      const propfindToARestoredFileInNewLocation = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: '/file (restored to a different location).txt',
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a PROPFIND request to a restored file in new location`)
          .withRequest({
            method: 'PROPFIND',
            path: MatchersV3.regex(
              '.*\\/remote\\.php\\/webdav\\/.*',
              '/remote.php/webdav/file%20(restored%20to%20a%20different%20location).txt/'
            ),
            headers: { authorization: getAuthHeaders(testUser, testUserPassword), ...applicationXmlResponseHeaders },
            body: filesListXmlRequestBody
          })
          .willRespondWith({
            status: 207,
            headers: responseHeader('application/xml; charset=utf-8'),
            body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
              dMultistatus.setAttributes({
                'xmlns:d': 'DAV:',
                'xmlns:s': 'http://sabredav.org/ns',
                'xmlns:oc': 'http://owncloud.org/ns'
              })
              dMultistatus.appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', '/remote.php/webdav/file%20(restored%20to%20a%20different%20location).txt')
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('d:getlastmodified', '', MatchersV3.like('Tue, 06 Oct 2020 12:15:24 GMT'))
                        .appendElement('d:resourcetype', '', '')
                        .appendElement('d:getetag', '', MatchersV3.regex('[a-f0-9]+', '5f7c5fdc06e47'))
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }
      it('should list the folder in the different location and no longer in trash-bin', async function () {
        const provider = createProvider(true, true)
        await getCapabilitiesInteraction(provider, testUser, testUserPassword)
        await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
        await MoveFromTrashbinToDifferentLocation(provider)
        await propfindToARestoredFileInNewLocationEmpty(provider)
        await propfindToARestoredFileInNewLocation(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud(testUser, testUserPassword)
          await oc.login()
          return oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
            return oc.fileTrash.list('/').then(trashItems => {
              expect(trashItems.length).toEqual(1)
              expect(trashItems[0].getName()).toEqual(testUser)
              return oc.files.fileInfo(originalLocation).then(fileInfo => {
                expect(fileInfo.getName()).toEqual(originalLocation)
              })
            }).catch(error => {
              fail(error)
            })
          })
        })
      })
    })

    // https://github.com/owncloud/ocis/issues/1122
    // Deleted file cannot be restored to different location
    describe('Trashbin errors should be handled correctly', function () {
      const MoveFromTrashbinToNonExistingLocation = provider => {
        return provider
          .given('the user is recreated', {
            username: testUser,
            password: testUserPassword
          })
          .given('file exists', {
            fileName: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .given('resource is deleted', {
            resourcePath: path.join(testFolder, testFile),
            username: testUser,
            password: testUserPassword
          })
          .uponReceiving(`as '${testUser}', a MOVE request to restore file from trashbin to a non existing location`)
          .withRequest({
            method: 'MOVE',
            path: MatchersV3.fromProviderState(
              `/remote.php/dav/trash-bin/${testUser}/\${trashId}`,
              `/remote.php/dav/trash-bin/${testUser}/${deletedFolderId}`
            ),
            headers: {
              authorization: getAuthHeaders(testUser, testUserPassword),
              Destination: mockServerBaseUrl + 'remote.php/dav/files/' + testUser + '/non-existing/new-file.txt'
            }
          })
          .willRespondWith({
            status: 409,
            headers: applicationXmlResponseHeaders,
            body: webdavExceptionResponseBody('Conflict', 'The destination node is not found')
          })
      }

      it('Trying to restore file should give error', async function () {
        const provider = createProvider(false, true)
        await getCapabilitiesInteraction(provider, testUser, testUserPassword)
        await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
        await MoveFromTrashbinToNonExistingLocation(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud(testUser, testUserPassword)
          await oc.login()
          return oc.fileTrash.restore(deletedFolderId, 'non-existing/new-file.txt').then(() => {
            fail('Restoring to non existing location should fail but passed')
          }).catch(error => {
            expect(error.message).toBe('The destination node is not found')
          })
        })
      })
    })
  })
})
