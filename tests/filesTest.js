describe('Main: Currently testing files management,', function () {
  // CURRENT TIME
  const timeRightNow = Math.random().toString(36).substr(2, 9)
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const testContent = 'testContent'
  const testFolder = '/testFolder' + timeRightNow
  const testSubDir = testFolder + '/' + 'subdir'
  const nonExistingDir = testFolder + '/' + 'nonExistingDir'
  const nonExistingFile = 'nonExistingFile' + timeRightNow
  const testSubFiles = [
    testFolder + '/' + 'file one.txt',
    testFolder + '/' + 'zz+z.txt',
    testFolder + '/' + '中文.txt',
    testFolder + '/' + 'abc.txt',
    testFolder + '/' + 'subdir/in dir.txt'
  ]

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
    let count = 0

    for (let i = 0; i < testSubFiles.length; i++) {
      oc.files.putFileContents(testSubFiles[i], testContent).then(status => {
        expect(typeof status).toBe('object')
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
      expect(error.message).toBe('File with name ' + nonExistingFile + ' could not be located')
      done()
    })
  })

  it('checking method : getFileContents for existent files', function (done) {
    let count = 0

    for (let i = 0; i < testSubFiles.length; i++) {
      oc.files.getFileContents(testSubFiles[i], { resolveWithResponseObject: true }).then((resp) => {
        expect(resp.body).toEqual(testContent)
        expect(resp.headers.ETag).toBeDefined()
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
    const newFile = testFolder + '/' + 'file.txt'

    oc.files.putFileContents(newFile, testContent).then(status => {
      expect(typeof status).toBe('object')
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

  it('checking method: getFileUrlV2', function () {
    const url = oc.files.getFileUrlV2('/foo/bar')
    expect(url).toBe(config.owncloudURL + 'remote.php/dav/files/admin/foo/bar')
  })

  it('checking method: favorite', function (done) {
    const newFile = testFolder + '/' + 'file.txt'

    oc.files.putFileContents(newFile, testContent).then(status => {
      expect(typeof status).toBe('object')
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
      fail(error)
      done()
    })
  })

  it('checking method: favorite filter', function (done) {
    const newFile = testFolder + '/' + 'file.txt'

    oc.files.putFileContents(newFile, testContent).then(status => {
      expect(typeof status).toBe('object')
      return oc.files.favorite(newFile)
    }).then(status2 => {
      expect(status2).toEqual(true)
      return oc.files.getFavoriteFiles(['{http://owncloud.org/ns}favorite'])
    }).then(files => {
      expect(files.length).toEqual(1)
      expect(files[0].getProperty('{http://owncloud.org/ns}favorite')).toEqual('1')
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
      expect(error.message).toBe('File with name ' + nonExistingDir.slice(1) + ' could not be located')
      done()
    })
  })

  it('checking method : mkdir for an existing parent path', function (done) {
    const newFolder = testFolder + '/' + 'new folder/'

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
      expect(error.message).toBe('Parent node does not exist')
      done()
    })
  })

  it('checking method : delete for an existing file', function (done) {
    const newFolder = testFolder + '/' + 'new folder'

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
      fail(folder2)
      done()
    }).catch(error => {
      console.log(error)
      expect(error.message).toBe('File with name ' + newFolder.slice(1) + ' could not be located')
      done()
    })
  })

  it('checking method : delete for a non existing file', function (done) {
    oc.files.delete(nonExistingDir).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error.message).toBe('File with name ' + nonExistingDir.slice(1) + ' could not be located')
      done()
    })
  })

  it('checking method : move existent file into same folder, same name', function (done) {
    oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error.message).toBe('Source and destination uri are identical.')
      done()
    })
  })

  it('checking method : move existent file into same folder, different name', function (done) {
    oc.files.move(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(testFolder)
    }).then(files => {
      const fileNames = []
      for (let i = 0; i < files.length; i++) {
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
      const fileNames = []
      for (let i = 0; i < files.length; i++) {
        fileNames.push(files[i].getName())
      }
      expect(fileNames.indexOf('中文.txt')).toBe(-1)
      return oc.files.list(testFolder)
    }).then(files2 => {
      const fileNames = []
      for (let i = 0; i < files2.length; i++) {
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
      expect(error.message).toBe('File with name ' + nonExistingFile + ' could not be located')
      done()
    })
  })

  it('checking method : copy existent file into same folder, same name', function (done) {
    oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error.message).toBe('Source and destination uri are identical.')
      done()
    })
  })

  it('checking method : copy existent file into same folder, different name', function (done) {
    oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(testFolder)
    }).then(files => {
      const fileNames = []
      for (let i = 0; i < files.length; i++) {
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
      const fileNames = []
      for (let i = 0; i < files.length; i++) {
        fileNames.push(files[i].getName())
      }
      expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1)
      return oc.files.list(testFolder)
    }).then(files2 => {
      const fileNames = []
      for (let i = 0; i < files2.length; i++) {
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
      expect(error.message).toBe('File with name ' + nonExistingFile + ' could not be located')
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

  it('checking method: filter by tag', function (done) {
    const newFile = testFolder + '/' + 'fileToTag.txt'
    const newTagName = 'testSystemTag' + timeRightNow
    let fileId = 0
    let tagId = 0

    oc.files.putFileContents(newFile, testContent).then(status => {
      expect(typeof status).toBe('object')
      return oc.files.fileInfo(newFile, ['{http://owncloud.org/ns}fileid'])
    }).then(fileInfo => {
      fileId = fileInfo.getFileId()
      return oc.systemTags.createTag({ name: newTagName })
    }).then(resp => {
      tagId = resp
      return oc.systemTags.tagFile(fileId, tagId)
    }).then(() => {
      return oc.files.getFilesByTags([tagId], ['{http://owncloud.org/ns}fileid'])
    }).then(files => {
      expect(files.length).toEqual(1)
      expect(files[0].getName()).toEqual('fileToTag.txt')
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('resolved the path of a file identified by its fileId', function (done) {
    const newFile = testFolder + '/' + 'fileToIdentify.txt'

    oc.files.putFileContents(newFile, '123456').then(() => {
      return oc.files.fileInfo(newFile, ['{http://owncloud.org/ns}fileid'])
    }).then(fileInfo => {
      const fileId = fileInfo.getFileId()
      return oc.files.getPathForFileId(fileId)
    }).then(path => {
      expect(path).toEqual(newFile)
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
