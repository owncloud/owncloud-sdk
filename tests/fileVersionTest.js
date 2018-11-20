describe('Main: Currently testing file versions management,', function () {
// CURRENT TIME
  var timeRightNow = new Date().getTime()
  var OwnCloud = require('../owncloud/owncloud')
  var config = require('../owncloud/test/config.json')

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testFolder = '/testFolder' + timeRightNow

  var versionedFile = testFolder + '/versioned.txt'
  var versionedFileInfo

  function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  beforeEach(function (done) {
    oc = new OwnCloud(config.owncloudURL)
    oc.login(config.username, config.password).then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })

      // create three versions
      oc.files.createFolder(testFolder).then(status => {
        oc.files.putFileContents(versionedFile, '*').then(status => {
          sleep(1000).then(() => {
            oc.files.putFileContents(versionedFile, '**').then(status => {
              sleep(1000).then(() => {
                oc.files.putFileContents(versionedFile, '***').then(status => {
                  oc.files.fileInfo(versionedFile, ['{http://owncloud.org/ns}fileid']).then(fileInfo => {
                    versionedFileInfo = fileInfo
                    done()
                  })
                })
              })
            })
          })
        })
      })
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })
  afterEach(function () {
    oc.files.delete(testFolder)
    oc.logout()
    oc = null
  })

  it('retrieves file versions', function (done) {
    oc.fileVersions.listVersions(versionedFileInfo.getFileId()).then(versions => {
      expect(versions.length).toEqual(2)
      expect(versions[0].getSize()).toEqual(2)
      expect(versions[1].getSize()).toEqual(1)
      done()
    })
  })
})
