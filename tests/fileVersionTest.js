/* globals OwnCloud, __karma__ */

describe('Currently testing file versions management,', function () {
// CURRENT TIME
  var timeRightNow = new Date().getTime()

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testFolder = '/testFolder' + timeRightNow

  var config = __karma__.config.ownCloudConfig
  var username = config.username
  var password = config.password
  var owncloudURL = config.owncloudURL

  var versionedFile = testFolder + '/versioned.txt'
  var versionedFileInfo

  beforeEach(function (done) {
    oc = new OwnCloud(owncloudURL)
    oc.login(username, password).then(status => {
      expect(status).toBe(true)

      // create three versions
      oc.files.createFolder(testFolder).then(status => {
        oc.files.putFileContents(versionedFile, 'version1').then(status => {
          oc.files.putFileContents(versionedFile, 'version2').then(status => {
            oc.files.putFileContents(versionedFile, 'version3').then(status => {
              oc.files.fileInfo(versionedFile).then(fileInfo => {
                versionedFileInfo = fileInfo
                done()
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
  })

  it('retrieves file versions', function (done) {
    oc.fileVersions.listVersions(versionedFileInfo.getFileId()).then(versions => {
      expect(versions.length).toEqual(2)
      console.log(versions)
      // TODO: more checks
    })
  })
})
