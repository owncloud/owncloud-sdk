describe('oc.fileTrash', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc
  let trashEnabled = false
  const userId = config.username

  beforeEach(function (done) {
    oc = new OwnCloud(config.owncloudURL)
    oc.login(config.username, config.password).then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })

      oc.getCapabilities().then(cap => {
        trashEnabled = (cap.dav.trashbin !== undefined)
        if (trashEnabled) {
          oc.fileTrash.clearTrashBin().then(() => {
            done()
          })
        } else {
          done()
        }
      })
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })
  afterEach(function (done) {
    oc.logout()
    oc = null
    done()
  })

  it('should have the trahbin capability set', function (done) {
    if (!trashEnabled) {
      pending()
    }
    oc.getCapabilities().then(cap => {
      expect(cap.dav.trashbin).toEqual('1.0')
      done()
    })
  })

  describe('when empty', function () {
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
    let testFolder, testFile

    beforeEach(function (done) {
      if (!trashEnabled) {
        pending()
      }

      const suffix = Math.random().toString(36).substr(2, 9)
      testFolder = 'testFolder' + suffix
      testFile = testFolder + '/file.txt'
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
          expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual('file.txt')
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
