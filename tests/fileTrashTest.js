fdescribe('oc.fileTrash', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc
  const trashEnabled = true
  const userId = config.username

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { validAuthHeaders, accessControlAllowHeaders, accessControlAllowMethods, setGeneralInteractions } = require('./pactHelper.js')
  beforeAll(function (done) {
    Promise.all(setGeneralInteractions(provider)).then(done, done.fail)
  })

  afterAll(function (done) {
    provider.removeInteractions().then(done, done.fail)
  })

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

  fdescribe('when empty', function () {
    beforeEach(async function (done) {
      const promises = []
      promises.push(setGeneralInteractions(provider))
      promises.push(provider.addInteraction({
        uponReceiving: 'PROPFIND to list trash items',
        withRequest: {
          method: 'PROPFIND',
          path: Pact.Matchers.term({
            matcher: '.*\\/remote\\.php\\/dav\\/trash-bin\\/admin\\/\\/$',
            generate: '/remote.php/dav/trash-bin/admin//'
          }),
          headers: validAuthHeaders,
          body: '<?xml version="1.0"?>\n' +
            '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
            '  <d:prop>\n' +
            '    <oc:trashbin-original-filename />\n' +
            '    <oc:trashbin-original-location />\n' +
            '    <oc:trashbin-delete-timestamp />\n' +
            '    <d:getcontentlength />\n' +
            '    <d:resourcetype />\n' +
            '  </d:prop>\n' +
            '</d:propfind>'
        },
        willRespondWith: {
          status: 207,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': accessControlAllowHeaders,
            'Access-Control-Allow-Methods': accessControlAllowMethods
          },
          body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
            '   <d:response>\n' +
            '      <d:href>/core/remote.php/dav/trash-bin/admin/</d:href>\n' +
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
            '</d:multistatus>'
        }
      }))
      Promise.all(promises).then(done, done.fail)
    })

    afterEach(function (done) {
      provider.removeInteractions().then(done, done.fail)
    })

    fit('should list no items ', function (done) {
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
    let testFolder, testFile

    beforeEach(function (done) {
      if (!trashEnabled) {
        pending()
      }

      testFolder = config.testFolder
      testFile = testFolder + '/' + config.testFile
      oc.files.createFolder(testFolder).then(() => {
        oc.files.putFileContents(testFile, '*').then(() => {
          oc.files.delete(testFolder).then(() => {
            done()
          })
        })
      })
    })

    afterEach(function (done) {
      if (trashEnabled) {
        oc.fileTrash.clearTrashBin().then(() => {
          done()
        })
      } else {
        done()
      }
    })

    it('should list a deleted folder', function (done) {
      if (!trashEnabled) {
        pending()
      }
      oc.fileTrash.list('/').then(trashItems => {
        console.log(trashItems)
        console.log(trashItems.length)
        console.log(trashItems[1])
        expect(trashItems.length).toEqual(2)
        expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFolder)
        done()
      })
    })

    it('should list an item within a deleted folder', function (done) {
      if (!trashEnabled) {
        pending()
      }
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
        })
      })
    })

    describe('and when this deleted folder is restored to its original location', function () {
      let deletedFolderId, originalLocation
      beforeEach(function (done) {
        if (!trashEnabled) {
          pending()
        }
        oc.fileTrash.list('/').then(trashItems => {
          deletedFolderId = trashItems[1].getName()
          originalLocation = trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')
          done()
        })
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
      let deletedFolderId
      let originalLocation
      beforeEach(function (done) {
        if (!trashEnabled) {
          pending()
        }
        originalLocation = testFolder + ' (restored to a different location)'
        oc.fileTrash.list('/').then(trashItems => {
          deletedFolderId = trashItems[1].getName()
          done()
        })
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
    let testFolder, testFile, suffix

    beforeEach(function (done) {
      if (!trashEnabled) {
        pending()
      }

      suffix = Math.random().toString(36).substr(2, 9)
      testFolder = `testFolder${suffix}`
      testFile = `file${suffix}.txt`
      oc.files.createFolder(testFolder).then(() => {
        oc.files.putFileContents(`${testFolder}/${testFile}`, '*').then(() => {
          oc.files.delete(`${testFolder}/${testFile}`).then(() => {
            done()
          })
        })
      })
    })

    afterEach(function (done) {
      if (trashEnabled) {
        oc.fileTrash.clearTrashBin().then(() => {
          done()
        })
      } else {
        done()
      }
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

    describe('and when this deleted file is restored to its original location', function () {
      let deletedFolderId, originalLocation
      beforeEach(function (done) {
        if (!trashEnabled) {
          pending()
        }
        oc.fileTrash.list('/').then(trashItems => {
          deletedFolderId = trashItems[1].getName()
          originalLocation = trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')
          done()
        })
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
      let deletedFolderId
      let originalLocation
      beforeEach(function (done) {
        if (!trashEnabled) {
          pending()
        }
        originalLocation = `file${suffix}(restored to a different location).txt`
        oc.fileTrash.list('/').then(trashItems => {
          deletedFolderId = trashItems[1].getName()
          done()
        })
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
