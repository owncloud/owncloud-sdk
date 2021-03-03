// TODO: Enable all tests
// enable all tests once owncloud-sdk is fully compatible with nodejs
//
// https://github.com/owncloud/owncloud-sdk/issues/705
import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('oc.fileTrash', function () {
  const config = require('./config/config.json')
  const username = config.adminUsername

  const trashEnabled = true

  const {
    validAdminAuthHeaders,
    getCurrentUserInformationInteraction,
    getCapabilitiesInteraction,
    createOwncloud,
    createProvider,
    applicationXmlResponseHeaders
  } = require('./pactHelper.js')

  const deletedFolderId = '2147596415'
  const deletedFileId = '2147596419'

  const trashbinPath = MatchersV3.regex(
    '.*\\/remote\\.php\\/dav\\/trash-bin\\/' + config.adminUsername + '\\/$',
    '/remote.php/dav/trash-bin/' + config.adminUsername + '/'
  )

  const trashbinFolderPath = MatchersV3.regex(
    '.*\\/remote\\.php\\/dav\\/trash-bin\\/' + config.adminUsername + '\\/' + deletedFolderId,
    '/remote.php/dav/trash-bin/' + config.adminUsername + '/' + deletedFolderId
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

  const trashbinXmlResponseBody = function (emptyTrashbin = true, deletedFolderId = null) {
    const xmlResponseBody = (extraBody = null) => {
      return new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
        dMultistatus.setAttributes({
          'xmlns:d': 'DAV:',
          'xmlns:s': 'http://sabredav.org/ns',
          'xmlns:oc': 'http://owncloud.org/ns'
        })
        const body = dMultistatus.appendElement('d:response', '', dResponse => {
          dResponse.appendElement('d:href', '', '/remote.php/dav/files/' + config.adminUsername)
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
                  .appendElement('oc:getcontentlength', '', '')
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
        dResponse.appendElement('d:href', '', '/remote.php/dav/trash-bin/' + config.adminUsername + '/' + deletedFolderId + '/')
          .appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('oc:trashbin-original-filename', '', 'testFolder')
                .appendElement('oc:trashbin-original-location', '', 'testFolder')
                .appendElement('oc:trashbin-delete-timestamp', '', '1601867256')
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
  const responseMethod = function (status, headers, body = null) {
    return {
      status: status,
      headers: headers,
      body: body
    }
  }

  describe('when deleting files and folders', function () {
    it('should have the trashbin capability set', async function () {
      const provider = createProvider()
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
      const provider = createProvider()
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await provider
        .uponReceiving(`as '${username}', a PROPFIND request to list empty trash`)
        .withRequest(requestMethod(
          'PROPFIND',
          trashbinPath,
          { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
          emptyTrashbinXmlRequestBody
        )).willRespondWith({
          status: 207,
          headers: applicationXmlResponseHeaders,
          body: trashbinXmlResponseBody()
        })
      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        if (!trashEnabled) {
          pending()
        }
        return oc.fileTrash.list('/').then(trashItems => {
          expect(trashItems.length).toEqual(1)
          expect(trashItems[0].getName()).toEqual(config.adminUsername)
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
          .uponReceiving(`as '${username}', a PROPFIND request to list trashbin items`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinPath,
            { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
            emptyTrashbinXmlRequestBody
          )).willRespondWith(responseMethod(
            207,
            responseHeader('application/xml; charset=utf-8'),
            trashbinXmlResponseBody(false, deletedFolderId)
          ))
      }
      const listItemWithinADeletedFolder = provider => {
        return provider
          .uponReceiving(`as '${username}', a PROPFIND request to list item within a deleted folder`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinFolderPath,
            { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
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
                dResponse.appendElement('d:href', '', '/remote.php/dav/files/' + config.adminUsername + '/testFile.txt')
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('oc:trashbin-original-filename', '', 'testFolder')
                        .appendElement('oc:trashbin-original-location', '', 'testFolder')
                        .appendElement('oc:trashbin-delete-timestamp', '', '1601867256')
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  }).appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp.appendElement('d:getcontentlength')
                    }).appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
              dMultistatus.appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', '/remote.php/dav/trash-bin/' + config.adminUsername + '/' + deletedFolderId + '/' + deletedFileId)
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('oc:trashbin-original-filename', '', 'testFile.txt')
                        .appendElement('oc:trashbin-original-location', '', 'testFolder/testFile.txt')
                        .appendElement('oc:trashbin-delete-timestamp', '', '1601867256')
                        .appendElement('d:getcontentlength', '', '1')
                        .appendElement('d:resourcetype', '', '')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }

      it('should list a deleted folder', async function () {
        const provider = createProvider()
        await getCapabilitiesInteraction(provider)
        await getCurrentUserInformationInteraction(provider)
        await propfindForTrashbinWithItems(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.fileTrash.list('/').then(trashItems => {
            expect(trashItems.length).toEqual(2)
            expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFolder)
          })
        })
      })

      it('should list an item within a deleted folder', async function () {
        const provider = createProvider()
        await getCapabilitiesInteraction(provider)
        await getCurrentUserInformationInteraction(provider)
        await listItemWithinADeletedFolder(provider)
        await propfindForTrashbinWithItems(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
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
          .uponReceiving(`as '${username}', a MOVE request to restore folder from trashbin to fileslist to original location`)
          .withRequest({
            method: 'MOVE',
            path: trashbinFolderPath,
            headers: {
              Destination: config.backendHost + 'remote.php/dav/files/' + config.adminUsername + '/' + config.testFolder
            }
          })
          .willRespondWith(responseMethod(
            201,
            applicationXmlResponseHeaders
          ))
      }

      const propfindForTrashbinWithItems = provider => {
        return provider
          .uponReceiving(`as '${username}', a PROPFIND request to list trashbin items`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinPath,
            { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
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
          .uponReceiving(`as '${username}', a PROPFIND request to a restored folder in original location`)
          .withRequest({
            method: 'PROPFIND',
            path: MatchersV3.regex(
              '.*\\/remote\\.php\\/webdav\\/' + testFolder,
              '/remote.php/webdav/' + testFolder
            ),
            headers: { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
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
                dResponse.appendElement('d:href', '', '/remote.php/dav/files/' + config.adminUsername + '/testFolder')
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('d:getlastmodified', '', 'Mon, 05 Oct 2020 09:29:37 GMT')
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                        .appendElement('d:quota-used-bytes', '', '1')
                        .appendElement('d:quota-available-bytes', '', '-3')
                        .appendElement('d:getetag', '', '5f7ae781e8073')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }

      it('should list the folder in the original location and no longer in trash-bin', async function () {
        const provider = createProvider()
        await getCapabilitiesInteraction(provider)
        await getCurrentUserInformationInteraction(provider)
        await moveFolderFromTrashbinToFilesList(provider)
        await propfindForTrashbinWithItems(provider)
        await propfindToARestoredFolderInOriginalLocation(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
            return oc.fileTrash.list('/').then(trashItems => {
              expect(trashItems.length).toEqual(1)
              expect(trashItems[0].getName()).toEqual(config.adminUsername)
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
      const originalLocation = testFolder + ' (restored to a different location)'

      const MoveFromTrashbinToDifferentLocation = provider => {
        return provider
          .uponReceiving(`as '${username}', a MOVE request to restore folder from trashbin to fileslist to a different location`)
          .withRequest({
            method: 'MOVE',
            path: trashbinFolderPath,
            headers: {
              Destination: config.backendHost + 'remote.php/dav/files/' + config.adminUsername + '/' + config.testFolder + '%20(restored%20to%20a%20different%20location)',
              ...validAdminAuthHeaders
            }
          })
          .willRespondWith(responseMethod(
            201,
            applicationXmlResponseHeaders
          ))
      }

      const PropfindToAnEmptytrashbinAfterRestoring = provider => {
        return provider
          .uponReceiving(`as '${username}', a PROPFIND request to an empty trashbin after restoring`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinPath,
            { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
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
          .uponReceiving(`as '${username}', a PROPFIND request to a restored folder in new location`)
          .withRequest({
            method: 'PROPFIND',
            path: MatchersV3.regex(
              '.*\\/remote\\.php\\/webdav\\/' + testFolder + '.*$',
              '/remote.php/webdav/' + testFolder
            ),
            headers: { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
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
                dResponse.appendElement('d:href', '', '/remote.php/dav/files/' + config.adminUsername + '/' + originalLocation)
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('d:getlastmodified', '', 'Mon, 05 Oct 2020 10:38:29 GMT')
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                        .appendElement('d:quota-used-bytes', '', '1')
                        .appendElement('d:quota-available-bytes', '', '-3')
                        .appendElement('d:getetag', '', '5f7ae781e8073')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }
      it('should list the folder in the different location and no longer in trash-bin', async function () {
        const provider = createProvider()
        await getCapabilitiesInteraction(provider)
        await getCurrentUserInformationInteraction(provider)
        await MoveFromTrashbinToDifferentLocation(provider)
        await PropfindToAnEmptytrashbinAfterRestoring(provider)
        await PropfindToARestoredFolderInNewLocation(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
            return oc.fileTrash.list('/').then(trashItems => {
              expect(trashItems.length).toEqual(1)
              expect(trashItems[0].getName()).toEqual(config.adminUsername)
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
          .uponReceiving(`as '${username}', a PROPFIND request to trash items before deleting file`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinPath,
            { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
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
                dResponse.appendElement('d:href', '', '/remote.php/dav/files/' + config.adminUsername + '/')
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
                        .appendElement('oc:getcontentlength', '', '')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 404 Not Found')
                  })
              }).appendElement('d:response', '', dResponse => {
                dResponse.appendElement('d:href', '', '/remote.php/dav/trash-bin/' + config.adminUsername + '/' + deletedFileId)
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('oc:trashbin-original-filename', '', testFile)
                        .appendElement('oc:trashbin-original-location', '', testFolder + '/' + testFile)
                        .appendElement('oc:trashbin-delete-timestamp', '', '1601986135')
                        .appendElement('d:getcontentlength', '', '1')
                        .appendElement('d:resourcetype', '', '')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }

      it('should list the deleted file', async function () {
        const provider = createProvider()
        await getCapabilitiesInteraction(provider)
        await getCurrentUserInformationInteraction(provider)
        await propfindTrashItemsBeforeDeletingFile(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
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
          .uponReceiving(`as '${username}', a MOVE request to restore file from trashbin to fileslist to a different location`)
          .withRequest({
            method: 'MOVE',
            path: trashbinFolderPath,
            headers: {
              Destination: config.backendHost + 'remote.php/dav/files/' + config.adminUsername + '/' + testFile
            }
          })
          .willRespondWith({
            status: 201,
            headers: applicationXmlResponseHeaders
          })
      }

      const propfindTrashItemsAfterRestoringDeletingFile = provider => {
        return provider
          .uponReceiving(`as '${username}', a PROPFIND request to trash items after restoring deleting file`)
          .withRequest(requestMethod(
            'PROPFIND',
            trashbinPath,
            { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
            emptyTrashbinXmlRequestBody
          ))
          .willRespondWith(responseMethod(207, responseHeader('application/xml; charset=utf-8'), trashbinXmlResponseBody()))
      }

      const propfindToARestoredFileInOriginalLocation = provider => {
        return provider
          .uponReceiving(`as '${username}', a PROPFIND request to a restored file in original location`)
          .withRequest({
            method: 'PROPFIND',
            path: MatchersV3.regex(
              '.*\\/remote\\.php\\/webdav\\/' + testFolder + '.*$',
              '/remote.php/webdav/' + testFolder
            ),
            headers: { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
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
                dResponse.appendElement('d:href', '', '/remote.php/dav/trash-bin/' + config.adminUsername + '/' + testFolder)
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('d:getlastmodified', '', 'Tue, 06 Oct 2020 12:15:24 GMT')
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                        .appendElement('d:quota-used-bytes', '', '1')
                        .appendElement('d:quota-available-bytes', '', '-3')
                        .appendElement('d:getetag', '', '5f7c5fdc06e47')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }

      it('should list the folder in the original location and no longer in trash-bin', async function () {
        const provider = createProvider()
        await getCapabilitiesInteraction(provider)
        await getCurrentUserInformationInteraction(provider)
        await MoveFromTrashbinToDifferentLocation(provider)
        await propfindTrashItemsAfterRestoringDeletingFile(provider)
        await propfindToARestoredFileInOriginalLocation(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
            return oc.fileTrash.list('/').then(trashItems => {
              expect(trashItems.length).toEqual(1)
              expect(trashItems[0].getName()).toEqual(config.adminUsername)
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
          .uponReceiving(`as '${username}', a MOVE request to restore file from trashbin to a new location`)
          .withRequest({
            method: 'MOVE',
            path: trashbinFolderPath,
            headers: {
              Destination: config.backendHost + 'remote.php/dav/files/' + config.adminUsername + '/file%20(restored%20to%20a%20different%20location).txt'
            }
          })
          .willRespondWith({
            status: 201,
            headers: applicationXmlResponseHeaders
          })
      }
      const propfindToARestoredFileInNewLocationEmpty = provider => {
        return provider
          .uponReceiving(`as '${username}', a PROPFIND request to trash items after restoring deleting file to new location`)
          .withRequest({
            method: 'PROPFIND',
            path: trashbinPath,
            headers: { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
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
          .uponReceiving(`as '${username}', a PROPFIND request to a restored file in new location`)
          .withRequest({
            method: 'PROPFIND',
            path: MatchersV3.regex(
              '.*\\/remote\\.php\\/webdav\\/.*',
              '/remote.php/webdav/.*$'
            ),
            headers: { ...validAdminAuthHeaders, ...applicationXmlResponseHeaders },
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
                dResponse.appendElement('d:href', '', '/remote.php/webdav/file%20(restored%20to%20a%20different%20location).txt/')
                  .appendElement('d:propstat', '', dPropstat => {
                    dPropstat.appendElement('d:prop', '', dProp => {
                      dProp
                        .appendElement('d:getlastmodified', '', 'Tue, 06 Oct 2020 12:15:24 GMT')
                        .appendElement('d:resourcetype', '', dResourceType => {
                          dResourceType.appendElement('d:collection', '', '')
                        })
                        .appendElement('d:quota-used-bytes', '', '0')
                        .appendElement('d:quota-available-bytes', '', '-3')
                        .appendElement('d:getetag', '', '5f7c5fdc06e47')
                    })
                      .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                  })
              })
            })
          })
      }
      it('should list the folder in the different location and no longer in trash-bin', async function () {
        const provider = createProvider()
        await getCapabilitiesInteraction(provider)
        await getCurrentUserInformationInteraction(provider)
        await MoveFromTrashbinToDifferentLocation(provider)
        await propfindToARestoredFileInNewLocationEmpty(provider)
        await propfindToARestoredFileInNewLocation(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
            return oc.fileTrash.list('/').then(trashItems => {
              expect(trashItems.length).toEqual(1)
              expect(trashItems[0].getName()).toEqual(config.adminUsername)
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
})
