describe('oc.fileTrash', function () {
// CURRENT TIME
  const timeRightNow = Math.random().toString(36).substr(2, 9)
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc
  let trashEnabled = false

  // TESTING CONFIGS
  const testFolder = 'testFolder' + timeRightNow
  const testFile = testFolder + '/file.txt'

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
  afterEach(function () {
    oc.logout()
    oc = null
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
        expect(trashItems[0].getName()).toEqual('items')
        done()
      })
    })
  })

  describe('when a folder is deleted', function () {
    beforeEach(function (done) {
      if (!trashEnabled) {
        pending()
      }
      oc.files.createFolder(testFolder).then(status => {
        oc.files.putFileContents(testFile, '*').then(status => {
          oc.files.delete(testFolder).then(() => {
            done()
          })
        })
      })
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
        oc.fileTrash.list(trashItems[1].getName()).then(trashItems => {
          expect(trashItems.length).toEqual(2)
          expect(trashItems[0].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual(testFolder)
          expect(trashItems[1].getProperty('{http://owncloud.org/ns}trashbin-original-filename')).toEqual('file.txt')
          done()
        })
      })
    })

    describe('and when this deleted folder is restored', function () {
      let deletedfolderId
      beforeEach(function (done) {
        if (!trashEnabled) {
          pending()
        }
        oc.fileTrash.list('/').then(trashItems => {
          deletedfolderId = trashItems[1].getName()
          done()
        })
      })
      it('should list the folder in the original location and no longer in trash-bin', function (done) {
        oc.fileTrash.restore(deletedfolderId).then(() => {
          oc.fileTrash.list('/').then(trashItems => {
            expect(trashItems.length).toEqual(1)
            expect(trashItems[0].getName()).toEqual('items')
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
  })
})
