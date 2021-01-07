describe('oc.fileTrash', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc
  const trashEnabled = true
  const userId = config.username

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    origin,
    validAuthHeaders,
    accessControlAllowHeaders,
    accessControlAllowMethods,

    CORSPreflightRequest,
    GETRequestToCloudUserEndpoint,
    capabilitiesGETRequestValidAuth
  } = require('./pactHelper.js')
  const deletedFolderId = '2147596415'
  const deletedFileId = '2147596419'

  const trashbinPath = Pact.Matchers.term({
    matcher: '.*\\/remote\\.php\\/dav\\/trash-bin\\/admin\\/\\/$',
    generate: '/remote.php/dav/trash-bin/admin//'
  })

  const trashbinFolderPath = Pact.Matchers.term({
    matcher: '.*\\/remote\\.php\\/dav\\/trash-bin\\/admin\\/' + deletedFolderId,
    generate: '/remote.php/dav/trash-bin/admin/' + deletedFolderId
  })

  const responseHeader = function (contentType) {
    return (
      {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': accessControlAllowMethods,
        'Content-Type': contentType
      }
    )
  }

  const emptyTrashbinXmlRequestBody = '<?xml version="1.0"?>\n' +
    '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
    '  <d:prop>\n' +
    '    <oc:trashbin-original-filename />\n' +
    '    <oc:trashbin-original-location />\n' +
    '    <oc:trashbin-delete-timestamp />\n' +
    '    <d:getcontentlength />\n' +
    '    <d:resourcetype />\n' +
    '  </d:prop>\n' +
    '</d:propfind>'

  const filesListXmlRequestBody = '<?xml version="1.0"?>\n' +
    '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
    '  <d:prop>\n' +
    '  </d:prop>\n' +
    '</d:propfind>'

  const trashbinXmlResponseBody = function (emptyTrashbin = true, deletedFolderId = null) {
    const xmlResponseBody = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
      '   <d:response>\n' +
      '      <d:href>/remote.php/dav/trash-bin/admin/</d:href>\n' +
      '      <d:propstat>\n' +
      '         <d:prop>\n' +
      '            <d:resourcetype>\n' +
      '               <d:collection />\n' +
      '            </d:resourcetype>\n' +
      '         </d:prop>\n' +
      '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
      '      </d:propstat>\n' +
      '      <d:propstat>\n' +
      '         <d:prop>\n' +
      '            <oc:trashbin-original-filename />\n' +
      '            <oc:trashbin-original-location />\n' +
      '            <oc:trashbin-delete-timestamp />\n' +
      '            <d:getcontentlength />\n' +
      '         </d:prop>\n' +
      '         <d:status>HTTP/1.1 404 Not Found</d:status>\n' +
      '      </d:propstat>\n' +
      '   </d:response>\n'
    if (emptyTrashbin) {
      return xmlResponseBody +
        '</d:multistatus>'
    } else {
      return xmlResponseBody +
        '   <d:response>\n' +
        '      <d:href>/remote.php/dav/trash-bin/admin/' + deletedFolderId + '/</d:href>\n' +
        '      <d:propstat>\n' +
        '         <d:prop>\n' +
        '            <oc:trashbin-original-filename>testFolder</oc:trashbin-original-filename>\n' +
        '            <oc:trashbin-original-location>testFolder</oc:trashbin-original-location>\n' +
        '            <oc:trashbin-delete-timestamp>1601867256</oc:trashbin-delete-timestamp>\n' +
        '            <d:resourcetype>\n' +
        '               <d:collection />\n' +
        '            </d:resourcetype>\n' +
        '         </d:prop>\n' +
        '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
        '      </d:propstat>\n' +
        '      <d:propstat>\n' +
        '         <d:prop>\n' +
        '            <d:getcontentlength />\n' +
        '         </d:prop>\n' +
        '         <d:status>HTTP/1.1 404 Not Found</d:status>\n' +
        '      </d:propstat>\n' +
        '   </d:response>\n' +
        '</d:multistatus>'
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

  beforeEach(function (done) {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password
        }
      }
    })

    oc.login().then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })
  afterEach(function (done) {
    oc.logout()
    oc = null
    done()
  })

  afterAll(function (done) {
    provider.verify().then(done, done.fail)
  })

  describe('when deleting files and folders', function () {
    beforeAll(function (done) {
      const promises = [
        provider.addInteraction(CORSPreflightRequest()),
        provider.addInteraction(capabilitiesGETRequestValidAuth()),
        provider.addInteraction(GETRequestToCloudUserEndpoint())
      ]
      Promise.all(promises).then(done, done.fail)
    })
    afterAll(function (done) {
      provider.removeInteractions().then(done, done.fail)
    })
    it('should have the trashbin capability set', function (done) {
      if (!trashEnabled) {
        pending()
      }
      oc.getCapabilities().then(cap => {
        expect(cap.capabilities.dav.trashbin).toEqual('1.0')
        done()
      }).catch(error => {
        fail(error)
        done()
      })
    })
  })

  describe('and when empty', function () {
    beforeAll(function (done) {
      const promises = [
        provider.addInteraction(CORSPreflightRequest()),
        provider.addInteraction(capabilitiesGETRequestValidAuth()),
        provider.addInteraction(GETRequestToCloudUserEndpoint())
      ]
      promises.push(provider.addInteraction({
        uponReceiving: 'PROPFIND empty trash',
        withRequest: requestMethod('PROPFIND', trashbinPath, validAuthHeaders, emptyTrashbinXmlRequestBody),
        willRespondWith: {
          status: 207,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': accessControlAllowHeaders,
            'Access-Control-Allow-Methods': accessControlAllowMethods
          },
          body: trashbinXmlResponseBody()
        }
      }))
      Promise.all(promises).then(done, done.fail)
    })

    afterAll(function (done) {
      provider.removeInteractions().then(done, done.fail)
    })

    it('should list no items ', function (done) {
      if (!trashEnabled) {
        pending()
      }
      oc.fileTrash.list('/').then(trashItems => {
        expect(trashItems.length).toEqual(1)
        expect(trashItems[0].getName()).toEqual(userId)
        done()
      })
    })
  })

  describe('when a folder is deleted', function () {
    const testFolder = config.testFolder
    const testFile = testFolder + '/' + config.testFile

    describe('and folder is not restored', function () {
      beforeAll(function (done) {
        const promises = [
          provider.addInteraction(CORSPreflightRequest()),
          provider.addInteraction(capabilitiesGETRequestValidAuth()),
          provider.addInteraction(GETRequestToCloudUserEndpoint())
        ]
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND to trashbin with items',
          withRequest: requestMethod('PROPFIND', trashbinPath, validAuthHeaders, emptyTrashbinXmlRequestBody),
          willRespondWith: responseMethod(
            207,
            responseHeader('application/xml; charset=utf-8'),
            trashbinXmlResponseBody(false, deletedFolderId))
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'list item within a deleted folder',
          withRequest: requestMethod('PROPFIND', trashbinFolderPath, validAuthHeaders, emptyTrashbinXmlRequestBody),
          willRespondWith: {
            status: 207,
            headers: responseHeader('application/xml; charset=utf-8'),
            body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
              '   <d:response>\n' +
              '      <d:href>/remote.php/dav/trash-bin/admin/' + deletedFolderId + '/</d:href>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <oc:trashbin-original-filename>testFolder</oc:trashbin-original-filename>\n' +
              '            <oc:trashbin-original-location>testFolder</oc:trashbin-original-location>\n' +
              '            <oc:trashbin-delete-timestamp>1601867256</oc:trashbin-delete-timestamp>\n' +
              '            <d:resourcetype>\n' +
              '               <d:collection />\n' +
              '            </d:resourcetype>\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
              '      </d:propstat>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <d:getcontentlength />\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 404 Not Found</d:status>\n' +
              '      </d:propstat>\n' +
              '   </d:response>\n' +
              '   <d:response>\n' +
              '      <d:href>/remote.php/dav/trash-bin/admin/' + deletedFolderId + '/' + deletedFileId + '</d:href>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <oc:trashbin-original-filename>testFile.txt</oc:trashbin-original-filename>\n' +
              '            <oc:trashbin-original-location>testFolder/testFile.txt</oc:trashbin-original-location>\n' +
              '            <oc:trashbin-delete-timestamp>1601867256</oc:trashbin-delete-timestamp>\n' +
              '            <d:getcontentlength>1</d:getcontentlength>\n' +
              '            <d:resourcetype />\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
              '      </d:propstat>\n' +
              '   </d:response>\n' +
              '</d:multistatus>'
          }
        }))
        Promise.all(promises).then(done, done.fail)
      })

      afterAll(function (done) {
        provider.removeInteractions().then(done, done.fail)
      })

      it('should list a deleted folder', function (done) {
        oc.fileTrash.list('/').then(trashItems => {
          expect(trashItems.length).toEqual(2)
          expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFolder)
          done()
        })
      })

      it('should list an item within a deleted folder', function (done) {
        oc.fileTrash.list('/').then(trashItems => {
          expect(trashItems.length).toEqual(2)
          expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFolder)
          expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-location')).toEqual(testFolder)
          oc.fileTrash.list(trashItems[1].getName()).then(trashItems => {
            expect(trashItems.length).toEqual(2)
            expect(trashItems[0].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFolder)
            expect(trashItems[0].getProperty('{http://owncloud.org/ns}trashbin-original-location')).toEqual(testFolder)
            expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(config.testFile)
            expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-location')).toEqual(testFile)
            done()
          }).catch(error => {
            fail(error)
            done()
          })
        })
      })
    })

    describe('and when this deleted folder is restored to its original location', function () {
      const originalLocation = testFolder
      beforeAll(function (done) {
        const promises = [
          provider.addInteraction(CORSPreflightRequest()),
          provider.addInteraction(capabilitiesGETRequestValidAuth()),
          provider.addInteraction(GETRequestToCloudUserEndpoint())
        ]
        promises.push(provider.addInteraction({
          uponReceiving: 'MOVE folder from trashbin to fileslist to original location',
          withRequest: {
            method: 'MOVE',
            path: trashbinFolderPath,
            headers: {
              Destination: config.owncloudURL + 'remote.php/dav/files/admin/' + config.testFolder
            }
          },
          willRespondWith: responseMethod(
            201,
            responseHeader('text/html; charset=utf-8')
          )
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND to an empty trashbin',
          withRequest: requestMethod('PROPFIND', trashbinPath, validAuthHeaders, emptyTrashbinXmlRequestBody),
          willRespondWith: responseMethod(
            207,
            responseHeader('text/html; charset=utf-8'),
            trashbinXmlResponseBody()
          )
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND to a restored folder in original location',
          withRequest: {
            method: 'PROPFIND',
            path: Pact.Matchers.term({
              matcher: '.*\\/remote\\.php\\/webdav\\/' + testFolder,
              generate: '/remote.php/webdav/' + testFolder
            }),
            headers: validAuthHeaders,
            body: filesListXmlRequestBody
          },
          willRespondWith: {
            status: 207,
            headers: responseHeader('text/html; charset=utf-8'),
            body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
              '   <d:response>\n' +
              '      <d:href>/remote.php/webdav/testFolder/</d:href>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <d:getlastmodified>Mon, 05 Oct 2020 09:29:37 GMT</d:getlastmodified>\n' +
              '            <d:resourcetype>\n' +
              '               <d:collection />\n' +
              '            </d:resourcetype>\n' +
              '            <d:quota-used-bytes>1</d:quota-used-bytes>\n' +
              '            <d:quota-available-bytes>-3</d:quota-available-bytes>\n' +
              '            <d:getetag>"5f7ae781e8073"</d:getetag>\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
              '      </d:propstat>\n' +
              '   </d:response>\n' +
              '</d:multistatus>'
          }
        }))
        Promise.all(promises).then(done, done.fail)
      })

      afterAll(function (done) {
        provider.removeInteractions().then(done, done.fail)
      })

      it('should list the folder in the original location and no longer in trash-bin', function (done) {
        oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
          oc.fileTrash.list('/').then(trashItems => {
            expect(trashItems.length).toEqual(1)
            expect(trashItems[0].getName()).toEqual(userId)
            oc.files.fileInfo(testFolder).then(fileInfo => {
              expect(fileInfo.getName()).toEqual(testFolder)
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })
      })
    })

    describe('and when this deleted folder is restored to a different location', function () {
      const originalLocation = testFolder + ' (restored to a different location)'

      beforeAll(function (done) {
        const promises = [
          provider.addInteraction(CORSPreflightRequest()),
          provider.addInteraction(capabilitiesGETRequestValidAuth()),
          provider.addInteraction(GETRequestToCloudUserEndpoint())
        ]
        promises.push(provider.addInteraction({
          uponReceiving: 'MOVE folder from trashbin to fileslist to a different location',
          withRequest: {
            method: 'MOVE',
            path: trashbinFolderPath,
            headers: {
              Destination: config.owncloudURL + 'remote.php/dav/files/admin/' + config.testFolder + '%20(restored%20to%20a%20different%20location)'
            }
          },
          willRespondWith: responseMethod(
            201,
            responseHeader('text/html; charset=utf-8')
          )
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND to an empty trashbin after restoring',
          withRequest: requestMethod('PROPFIND', trashbinPath, validAuthHeaders, emptyTrashbinXmlRequestBody),
          willRespondWith: responseMethod(
            207,
            responseHeader('text/html; charset=utf-8'),
            trashbinXmlResponseBody()
          )
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND to a restored folder in new location',
          withRequest: {
            method: 'PROPFIND',
            path: Pact.Matchers.term({
              matcher: '.*\\/remote\\.php\\/webdav\\/' + testFolder + '.*$',
              generate: '/remote.php/webdav/' + testFolder + '.*$'
            }),
            headers: validAuthHeaders,
            body: filesListXmlRequestBody
          },
          willRespondWith: {
            status: 207,
            headers: responseHeader('text/html; charset=utf-8'),
            body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
              '   <d:response>\n' +
              '      <d:href>/remote.php/webdav/testFolder%20(restored%20to%20a%20different%20location)/</d:href>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <d:getlastmodified>Mon, 05 Oct 2020 10:38:29 GMT</d:getlastmodified>\n' +
              '            <d:resourcetype>\n' +
              '               <d:collection />\n' +
              '            </d:resourcetype>\n' +
              '            <d:quota-used-bytes>1</d:quota-used-bytes>\n' +
              '            <d:quota-available-bytes>-3</d:quota-available-bytes>\n' +
              '            <d:getetag>"5f7af7a600721"</d:getetag>\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
              '      </d:propstat>\n' +
              '   </d:response>\n' +
              '</d:multistatus>'
          }
        }))
        Promise.all(promises).then(done, done.fail)
      })
      afterAll(function (done) {
        provider.removeInteractions().then(done, done.fail)
      })

      it('should list the folder in the different location and no longer in trash-bin', function (done) {
        oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
          oc.fileTrash.list('/').then(trashItems => {
            expect(trashItems.length).toEqual(1)
            expect(trashItems[0].getName()).toEqual(userId)
            oc.files.fileInfo(originalLocation).then(fileInfo => {
              expect(fileInfo.getName()).toEqual(originalLocation)
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })
      })
    })
  })

  describe('when a file is deleted', function () {
    const testFolder = config.testFolder
    const testFile = config.testFile

    describe('and file is not restored', function () {
      beforeAll(function (done) {
        const promises = [
          provider.addInteraction(CORSPreflightRequest()),
          provider.addInteraction(capabilitiesGETRequestValidAuth()),
          provider.addInteraction(GETRequestToCloudUserEndpoint())
        ]
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND trash items before deleting file',
          withRequest: requestMethod('PROPFIND', trashbinPath, validAuthHeaders, emptyTrashbinXmlRequestBody),
          willRespondWith: {
            status: 207,
            headers: responseHeader('application/xml; charset=utf-8'),
            body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
              '   <d:response>\n' +
              '      <d:href>/remote.php/dav/trash-bin/admin/</d:href>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <d:resourcetype>\n' +
              '               <d:collection />\n' +
              '            </d:resourcetype>\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
              '      </d:propstat>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <oc:trashbin-original-filename />\n' +
              '            <oc:trashbin-original-location />\n' +
              '            <oc:trashbin-delete-timestamp />\n' +
              '            <d:getcontentlength />\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 404 Not Found</d:status>\n' +
              '      </d:propstat>\n' +
              '   </d:response>\n' +
              '   <d:response>\n' +
              '      <d:href>/remote.php/dav/trash-bin/admin/' + deletedFileId + '</d:href>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <oc:trashbin-original-filename>' + testFile + '</oc:trashbin-original-filename>\n' +
              '            <oc:trashbin-original-location>' + testFolder + '/' + testFile + '</oc:trashbin-original-location>\n' +
              '            <oc:trashbin-delete-timestamp>1601986135</oc:trashbin-delete-timestamp>\n' +
              '            <d:getcontentlength>1</d:getcontentlength>\n' +
              '            <d:resourcetype />\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
              '      </d:propstat>\n' +
              '   </d:response>\n' +
              '</d:multistatus>'
          }
        }))
        Promise.all(promises).then(done, done.fail)
      })

      afterAll(function (done) {
        provider.removeInteractions().then(done, done.fail)
      })

      it('should list the deleted file', function (done) {
        if (!trashEnabled) {
          pending()
        }
        oc.fileTrash.list('/').then(trashItems => {
          expect(trashItems.length).toEqual(2)
          expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFile)
          expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-location')).toEqual(`${testFolder}/${testFile}`)
          done()
        })
      })
    })

    describe('and when this deleted file is restored to its original location', function () {
      const originalLocation = testFile
      beforeAll(function (done) {
        const promises = [
          provider.addInteraction(CORSPreflightRequest()),
          provider.addInteraction(capabilitiesGETRequestValidAuth()),
          provider.addInteraction(GETRequestToCloudUserEndpoint())
        ]
        promises.push(provider.addInteraction({
          uponReceiving: 'MOVE file from trashbin to fileslist to a different location',
          withRequest: {
            method: 'MOVE',
            path: trashbinFolderPath,
            headers: {
              Destination: config.owncloudURL + 'remote.php/dav/files/admin/' + testFile
            }
          },
          willRespondWith: {
            status: 201,
            headers: responseHeader('text/html; charset=utf-8')
          }
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND trash items after restoring deleting file',
          withRequest: requestMethod('PROPFIND', trashbinPath, validAuthHeaders, emptyTrashbinXmlRequestBody),
          willRespondWith: responseMethod(207, responseHeader('application/xml; charset=utf-8'), trashbinXmlResponseBody())
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND to a restored file in original location',
          withRequest: {
            method: 'PROPFIND',
            path: Pact.Matchers.term({
              matcher: '.*\\/remote\\.php\\/webdav\\/' + testFolder + '.*$',
              generate: '/remote.php/webdav/' + testFolder + '.*$'
            }),
            headers: validAuthHeaders,
            body: filesListXmlRequestBody
          },
          willRespondWith: {
            status: 207,
            headers: responseHeader('application/xml; charset=utf-8'),
            body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
              '   <d:response>\n' +
              '      <d:href>/remote.php/webdav/' + testFolder + '/</d:href>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <d:getlastmodified>Tue, 06 Oct 2020 12:15:24 GMT</d:getlastmodified>\n' +
              '            <d:resourcetype>\n' +
              '               <d:collection />\n' +
              '            </d:resourcetype>\n' +
              '            <d:quota-used-bytes>0</d:quota-used-bytes>\n' +
              '            <d:quota-available-bytes>-3</d:quota-available-bytes>\n' +
              '            <d:getetag>"5f7c5fdc06e47"</d:getetag>\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
              '      </d:propstat>\n' +
              '   </d:response>\n' +
              '</d:multistatus>'
          }
        }))
        Promise.all(promises).then(done, done.fail)
      })

      afterAll(function (done) {
        provider.removeInteractions().then(done, done.fail)
      })
      it('should list the folder in the original location and no longer in trash-bin', function (done) {
        oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
          oc.fileTrash.list('/').then(trashItems => {
            expect(trashItems.length).toEqual(1)
            expect(trashItems[0].getName()).toEqual(userId)
            oc.files.fileInfo(testFolder).then(fileInfo => {
              expect(fileInfo.getName()).toEqual(testFolder)
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })
      })
    })

    describe('and when this deleted file is restored to a different location', function () {
      const originalLocation = 'file (restored to a different location).txt'

      beforeAll(function (done) {
        const promises = [
          provider.addInteraction(CORSPreflightRequest()),
          provider.addInteraction(capabilitiesGETRequestValidAuth()),
          provider.addInteraction(GETRequestToCloudUserEndpoint())
        ]
        promises.push(provider.addInteraction({
          uponReceiving: 'MOVE file from trashbin to a new location',
          withRequest: {
            method: 'MOVE',
            path: trashbinFolderPath,
            headers: {
              Destination: config.owncloudURL + 'remote.php/dav/files/admin/file%20(restored%20to%20a%20different%20location).txt'
            }
          },
          willRespondWith: {
            status: 201,
            headers: responseHeader('text/html; charset=utf-8')
          }
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND trash items after restoring deleting file to new location',
          withRequest: {
            method: 'PROPFIND',
            path: trashbinPath,
            headers: validAuthHeaders,
            body: emptyTrashbinXmlRequestBody
          },
          willRespondWith: {
            status: 207,
            headers: responseHeader('application/xml; charset=utf-8'),
            body: trashbinXmlResponseBody()
          }
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'PROPFIND to a restored file in new location',
          withRequest: {
            method: 'PROPFIND',
            path: Pact.Matchers.term({
              matcher: '.*\\/remote\\.php\\/webdav\\/.*',
              generate: '/remote.php/webdav/.*$'
            }),
            headers: validAuthHeaders,
            body: filesListXmlRequestBody
          },
          willRespondWith: {
            status: 207,
            headers: responseHeader('application/xml; charset=utf-8'),
            body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
              '   <d:response>\n' +
              '      <d:href>/remote.php/webdav/file%20(restored%20to%20a%20different%20location).txt/</d:href>\n' +
              '      <d:propstat>\n' +
              '         <d:prop>\n' +
              '            <d:getlastmodified>Tue, 06 Oct 2020 12:15:24 GMT</d:getlastmodified>\n' +
              '            <d:resourcetype>\n' +
              '               <d:collection />\n' +
              '            </d:resourcetype>\n' +
              '            <d:quota-used-bytes>0</d:quota-used-bytes>\n' +
              '            <d:quota-available-bytes>-3</d:quota-available-bytes>\n' +
              '            <d:getetag>"5f7c5fdc06e47"</d:getetag>\n' +
              '         </d:prop>\n' +
              '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
              '      </d:propstat>\n' +
              '   </d:response>\n' +
              '</d:multistatus>'
          }
        }))
        Promise.all(promises).then(done, done.fail)
      })

      afterAll(function (done) {
        provider.removeInteractions().then(done, done.fail)
      })

      it('should list the folder in the different location and no longer in trash-bin', function (done) {
        oc.fileTrash.restore(deletedFolderId, originalLocation).then(() => {
          oc.fileTrash.list('/').then(trashItems => {
            expect(trashItems.length).toEqual(1)
            expect(trashItems[0].getName()).toEqual(userId)
            oc.files.fileInfo(originalLocation).then(fileInfo => {
              expect(fileInfo.getName()).toEqual(originalLocation)
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })
      })
    })
  })
})
