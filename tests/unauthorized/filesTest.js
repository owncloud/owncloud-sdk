describe('Unauthorized: Currently testing files management,', function () {
// CURRENT TIME
  var timeRightNow = new Date().getTime()
  var OwnCloud = require('../../src')
  var config = require('../config/config.json')

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testContent = 'testContent'
  var testFolder = '/testFolder' + timeRightNow
  var testSubFiles = [
    testFolder + '/' + 'file one.txt',
    testFolder + '/' + 'zz+z.txt',
    testFolder + '/' + '中文.txt',
    testFolder + '/' + 'abc.txt',
    testFolder + '/' + 'subdir/in dir.txt'
  ]

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password + timeRightNow
        }
      }
    })

    oc.login()
  })

  it('checking method : list', function (done) {
    oc.files.list(testFolder, 1).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Username or password was incorrect, Username or password was incorrect')
      done()
    })
  })

  it('checking method : getFileContents', function (done) {
    var count = 0

    for (var i = 0; i < testSubFiles.length; i++) {
      oc.files.getFileContents(testSubFiles[i]).then(() => {
        fail()
        done()
      }).catch(error => {
        expect(error).toMatch('Username or password was incorrect, Username or password was incorrect')
        count++
        if (count === testSubFiles.length) {
          done()
        }
      })
    }
  })

  it('checking method : putFileContents', function (done) {
    var newFile = testFolder + '/' + 'file.txt'

    oc.files.putFileContents(newFile, testContent).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Username or password was incorrect, Username or password was incorrect')
      done()
    })
  })

  it('checking method : mkdir', function (done) {
    var newFolder = testFolder + '/' + 'new folder/'

    oc.files.mkdir(newFolder).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Username or password was incorrect, Username or password was incorrect')
      done()
    })
  })

  it('checking method : delete', function (done) {
    var newFolder = testFolder + '/' + 'new folder'

    oc.files.mkdir(newFolder).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Username or password was incorrect, Username or password was incorrect')
      done()
    })
  })

  it('checking method : getFile', function (done) {
    var file = 'tempFile' + timeRightNow

    oc.files.putFileContents(file, testContent).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Username or password was incorrect, Username or password was incorrect')
      done()
    })
  })

  it('checking method : move', function (done) {
    oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Username or password was incorrect, Username or password was incorrect')
      done()
    })
  })

  it('checking method : copy', function (done) {
    oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Username or password was incorrect, Username or password was incorrect')
      done()
    })
  })
})
