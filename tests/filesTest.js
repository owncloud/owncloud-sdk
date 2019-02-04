describe('Main: Currently testing files management,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testContent = 'testContent'
  var testFolder = '/testFolder' + timeRightNow
  var testSubDir = testFolder + '/' + 'subdir'
  var nonExistingDir = testFolder + '/' + 'nonExistingDir'
  var nonExistingFile = 'nonExistingFile' + timeRightNow
  var testSubFiles = [
    testFolder + '/' + 'file one.txt',
    testFolder + '/' + 'zz+z.txt',
    testFolder + '/' + '中文.txt',
    testFolder + '/' + 'abc.txt',
    testFolder + '/' + 'subdir/in dir.txt'
  ]

  beforeEach(function (done) {
    oc = new OwnCloud(config.owncloudURL)
    oc.login(config.username, config.password).then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  afterEach(function () {
    oc.logout()
    oc = null
  })

  it('creates the testFolder at instance', function (done) {
    oc.files.createFolder(testFolder).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('creates subfolder at instance', function (done) {
    oc.files.mkdir(testSubDir).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('creates subfiles at instance', function (done) {
    var count = 0

    for (var i = 0; i < testSubFiles.length; i++) {
      oc.files.putFileContents(testSubFiles[i], testContent).then(status => {
        expect(status).toBe(true)
        count++
        if (count === testSubFiles.length) {
          done()
        }
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    }
  })

  it('checking method : list with no depth specified', function (done) {
    oc.files.list(testFolder).then(files => {
      expect(typeof (files)).toBe('object')
      expect(files.length).toEqual(6)
      expect(files[1].getName()).toEqual('abc.txt')
      expect(files[2].getName()).toEqual('file one.txt')
      expect(files[3].getName()).toEqual('subdir')
      expect(files[4].getName()).toEqual('zz+z.txt')
      expect(files[5].getName()).toEqual('中文.txt')
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : list with Infinity depth', function (done) {
    oc.files.list(testFolder, 'infinity').then(files => {
      expect(typeof (files)).toBe('object')
      expect(files.length).toEqual(7)
      expect(files[3].getName()).toEqual('subdir')
      expect(files[4].getPath()).toEqual(testFolder + '/' + 'subdir/')
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : list with 2 depth', function (done) {
    oc.files.list(testFolder, 2).then(files => {
      expect(typeof (files)).toBe('object')
      expect(files.length).toEqual(7)
      expect(files[3].getName()).toEqual('subdir')
      expect(files[4].getPath()).toEqual(testFolder + '/' + 'subdir/')
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : list with non existent file', function (done) {
    oc.files.list(nonExistingFile).then(files => {
      expect(files).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('File with name ' + nonExistingFile + ' could not be located')
      done()
    })
  })

  it('checking method : getFileContents for existent files', function (done) {
    var count = 0

    for (var i = 0; i < testSubFiles.length; i++) {
      oc.files.getFileContents(testSubFiles[i]).then(content => {
        expect(content).toEqual(testContent)
        count++
        if (count === testSubFiles.length) {
          done()
        }
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    }
  })

  // because called from the browser this is not returning xml but html - needs to be adjusted
  xit('checking method : getFileContents for non existent file', function (done) {
    oc.files.getFileContents(nonExistingFile).then(content => {
      expect(content).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('File with name ' + nonExistingFile + ' could not be located')
      done()
    })
  })

  it('checking method : putFileContents for an existing parent path', function (done) {
    var newFile = testFolder + '/' + 'file.txt'

    oc.files.putFileContents(newFile, testContent).then(status => {
      expect(status).toBe(true)
      return oc.files.getFileContents(newFile)
    }).then(content => {
      expect(content).toEqual(testContent)
      return oc.files.delete(newFile)
    }).then(status2 => {
      expect(status2).toEqual(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method: getFileUrl', function () {
    const url = oc.files.getFileUrl('/foo/bar')
    expect(url).toBe(config.owncloudURL + 'remote.php/webdav/foo/bar')
  })

  it('checking method: favorite', function (done) {
    var newFile = testFolder + '/' + 'file.txt'

    oc.files.putFileContents(newFile, testContent).then(status => {
      expect(status).toBe(true)
      return oc.files.favorite(newFile)
    }).then(status2 => {
      expect(status2).toEqual(true)
      return oc.files.fileInfo(newFile, ['{http://owncloud.org/ns}favorite'])
    }).then(fileInfo => {
      expect(fileInfo.getProperty('{http://owncloud.org/ns}favorite')).toEqual('1')
      return oc.files.favorite(newFile, false)
    }).then(status2 => {
      expect(status2).toEqual(true)
      return oc.files.fileInfo(newFile, ['{http://owncloud.org/ns}favorite'])
    }).then(fileInfo => {
      expect(fileInfo.getProperty('{http://owncloud.org/ns}favorite')).toEqual('0')
      return oc.files.delete(newFile)
    }).then(status2 => {
      expect(status2).toEqual(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : putFileContents for a non existing parent path', function (done) {
    oc.files.putFileContents(nonExistingDir + '/' + 'file.txt', testContent).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('File with name ' + nonExistingDir.slice(1) + ' could not be located')
      done()
    })
  })

  it('checking method : mkdir for an existing parent path', function (done) {
    var newFolder = testFolder + '/' + 'new folder/'

    oc.files.mkdir(newFolder).then(status => {
      expect(status).toBe(true)
      return oc.files.list(newFolder, 0)
    }).then(folder => {
      folder = folder[0]
      expect(folder.isDir()).toBe(true)
      expect(folder.getName()).toEqual('new folder')
      return oc.files.delete(newFolder)
    }).then(status2 => {
      expect(status2).toEqual(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : mkdir for a non existing parent path', function (done) {
    oc.files.mkdir(nonExistingDir + '/' + 'newFolder/').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Parent node does not exist')
      done()
    })
  })

  it('checking method : delete for an existing file', function (done) {
    var newFolder = testFolder + '/' + 'new folder'

    oc.files.mkdir(newFolder).then(status => {
      expect(status).toBe(true)
      return oc.files.list(newFolder, 0)
    }).then(folder => {
      folder = folder[0]
      expect(folder.isDir()).toBe(true)
      expect(folder.getName()).toEqual('new folder')
      return oc.files.delete(newFolder)
    }).then(status2 => {
      expect(status2).toEqual(true)
      return oc.files.list(newFolder, 0)
    }).then(folder2 => {
      expect(folder2).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('File with name ' + newFolder.slice(1) + ' could not be located')
      done()
    })
  })

  it('checking method : delete for a non existing file', function (done) {
    oc.files.delete(nonExistingDir).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('File with name ' + nonExistingDir.slice(1) + ' could not be located')
      done()
    })
  })

  it('checking method : move existent file into same folder, same name', function (done) {
    oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe('Source and destination uri are identical.')
      done()
    })
  })

  it('checking method : move existent file into same folder, different name', function (done) {
    oc.files.move(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(testFolder)
    }).then(files => {
      var fileNames = []
      for (var i = 0; i < files.length; i++) {
        fileNames.push(files[i].getName())
      }
      expect(fileNames.indexOf('中文123.txt')).toBeGreaterThan(-1)
      expect(fileNames.indexOf('中文.txt')).toBe(-1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : move existent file into different folder', function (done) {
    oc.files.move(testFolder + '/中文123.txt', testFolder + '/中文.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(testFolder + '/subdir')
    }).then(files => {
      var fileNames = []
      for (var i = 0; i < files.length; i++) {
        fileNames.push(files[i].getName())
      }
      expect(fileNames.indexOf('中文.txt')).toBe(-1)
      return oc.files.list(testFolder)
    }).then(files2 => {
      var fileNames = []
      for (var i = 0; i < files2.length; i++) {
        fileNames.push(files2[i].getName())
      }
      expect(fileNames.indexOf('中文123.txt')).toBe(-1)
      expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : move non existent file', function (done) {
    oc.files.move(nonExistingFile, '/abcd.txt').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('File with name ' + nonExistingFile + ' could not be located')
      done()
    })
  })

  it('checking method : copy existent file into same folder, same name', function (done) {
    oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe('Source and destination uri are identical.')
      done()
    })
  })

  it('checking method : copy existent file into same folder, different name', function (done) {
    oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(testFolder)
    }).then(files => {
      var fileNames = []
      for (var i = 0; i < files.length; i++) {
        fileNames.push(files[i].getName())
      }
      expect(fileNames.indexOf('中文123.txt')).toBeGreaterThan(-1)
      expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : copy existent file into different folder', function (done) {
    oc.files.copy(testFolder + '/中文123.txt', testFolder + '/subdir/中文.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(testFolder + '/subdir')
    }).then(files => {
      var fileNames = []
      for (var i = 0; i < files.length; i++) {
        fileNames.push(files[i].getName())
      }
      expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1)
      return oc.files.list(testFolder)
    }).then(files2 => {
      var fileNames = []
      for (var i = 0; i < files2.length; i++) {
        fileNames.push(files2[i].getName())
      }
      expect(fileNames.indexOf('中文123.txt')).toBeGreaterThan(-1)
      expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : copy non existent file', function (done) {
    oc.files.copy(nonExistingFile, '/abcd.txt').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('File with name ' + nonExistingFile + ' could not be located')
      done()
    })
  })

  it('searches in the instance', function (done) {
    const davProperties = [
      '{http://owncloud.org/ns}favorite',
      '{DAV:}getcontentlength',
      '{http://owncloud.org/ns}size',
      '{DAV:}getlastmodified',
      '{DAV:}resourcetype'
    ]

    oc.files.search('abc', 30, davProperties).then(files => {
      expect(typeof (files)).toBe('object')
      expect(files.length).toEqual(1)
      expect(files[0].getName()).toEqual('abc.txt')
      expect(files[0].getPath()).toEqual(testFolder + '/')
      expect(files[0].getSize()).toEqual(11)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('deletes the test folder at instance', function (done) {
    oc.files.delete(testFolder).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })
})
