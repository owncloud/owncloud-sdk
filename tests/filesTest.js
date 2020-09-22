fdescribe('Main: Currently testing files management,', function () {
  // CURRENT TIME
  const timeRightNow = Math.random().toString(36).substr(2, 9)
  const FileInfo = require('../src/fileInfo')
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')
  const sinon = require('sinon')

  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const testContent = 'testContent'
  const testSubDir = config.testFolder + '/' + 'subdir'
  const nonExistentFile = 'nonExistentFile' + timeRightNow
  const testSubFiles = [
    config.testFolder + '/' + 'file one.txt',
    config.testFolder + '/' + 'zz+z.txt',
    config.testFolder + '/' + '中文.txt',
    config.testFolder + '/' + 'abc.txt',
    config.testFolder + '/' + 'subdir/in dir.txt'
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

  fit('creates the testFolder at instance', function (done) {
    oc.files.createFolder(config.testFolder).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  fit('creates subfolder at instance', function (done) {
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
    oc.files.list(config.testFolder).then(files => {
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
    oc.files.list(config.testFolder, 'infinity').then(files => {
      expect(typeof (files)).toBe('object')
      expect(files.length).toEqual(7)
      expect(files[3].getName()).toEqual('subdir')
      expect(files[4].getPath()).toEqual(config.testFolder + '/' + 'subdir/')
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : list with 2 depth', function (done) {
    oc.files.list(config.testFolder, 2).then(files => {
      expect(typeof (files)).toBe('object')
      expect(files.length).toEqual(7)
      expect(files[3].getName()).toEqual('subdir')
      expect(files[4].getPath()).toEqual(config.testFolder + '/' + 'subdir/')
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : list with non existent file', function (done) {
    oc.files.list(nonExistentFile).then(files => {
      expect(files).toBe(null)
      done()
    }).catch(error => {
      expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
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
    oc.files.getFileContents(nonExistentFile).then(content => {
      expect(content).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('File with name ' + nonExistentFile + ' could not be located')
      done()
    })
  })

  describe('checking method : putFileContents', function () {
    it('uploads file for an existing parent path', async function () {
      const newFile = config.testFolder + '/' + 'file.txt'
      let progressCalled = false

      const options = {
        onProgress: (progressInfo) => {
          progressCalled = true
        }
      }

      try {
        let status = await oc.files.putFileContents(newFile, testContent, options)
        expect(typeof status).toBe('object')
        expect(progressCalled).toEqual(true)
        const content = await oc.files.getFileContents(newFile)
        expect(content).toEqual(testContent)
        status = await oc.files.delete(newFile)
        expect(status).toEqual(true)
      } catch (error) {
        fail(error)
      }
    })

    it('fails with error when uploading to a non-existent parent path', function (done) {
      oc.files.putFileContents(config.nonExistentDir + '/' + 'file.txt', testContent).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.message).toBe('File with name ' + config.nonExistentDir.slice(1) + ' could not be located')
        done()
      })
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
    const newFile = config.testFolder + '/' + 'file.txt'

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
    const newFile = config.testFolder + '/' + 'file.txt'

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

  fit('checking method : mkdir for an existing parent path', function (done) {
    const newFolder = config.testFolder + '/' + 'new folder/'

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

  fit('checking method : mkdir for a non-existent parent path', function (done) {
    oc.files.mkdir(config.testFolder + '/' + config.nonExistentDir + '/newFolder/').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error.message).toBe('Parent node does not exist')
      done()
    })
  })

  it('checking method : delete for an existing file', function (done) {
    const newFolder = config.testFolder + '/' + 'new folder'

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

  it('checking method : delete for a non-existent file', function (done) {
    oc.files.delete(config.nonExistentDir).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error.message).toBe('File with name ' + config.nonExistentDir.slice(1) + ' could not be located')
      done()
    })
  })

  it('checking method : move existent file into same folder, same name', function (done) {
    oc.files.move(config.testFolder + '/中文.txt', config.testFolder + '/中文.txt').then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error.message).toBe('Source and destination uri are identical.')
      done()
    })
  })

  it('checking method : move existent file into same folder, different name', function (done) {
    oc.files.move(config.testFolder + '/中文.txt', config.testFolder + '/中文123.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(config.testFolder)
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
    oc.files.move(config.testFolder + '/中文123.txt', config.testFolder + '/中文.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(config.testFolder + '/subdir')
    }).then(files => {
      const fileNames = []
      for (let i = 0; i < files.length; i++) {
        fileNames.push(files[i].getName())
      }
      expect(fileNames.indexOf('中文.txt')).toBe(-1)
      return oc.files.list(config.testFolder)
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
    oc.files.move(nonExistentFile, '/abcd.txt').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
      done()
    })
  })

  it('checking method : copy existent file into same folder, same name', function (done) {
    oc.files.copy(config.testFolder + '/中文.txt', config.testFolder + '/中文.txt').then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error.message).toBe('Source and destination uri are identical.')
      done()
    })
  })

  it('checking method : copy existent file into same folder, different name', function (done) {
    oc.files.copy(config.testFolder + '/中文.txt', config.testFolder + '/中文123.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(config.testFolder)
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
    oc.files.copy(config.testFolder + '/中文123.txt', config.testFolder + '/subdir/中文.txt').then(status => {
      expect(status).toBe(true)
      return oc.files.list(config.testFolder + '/subdir')
    }).then(files => {
      const fileNames = []
      for (let i = 0; i < files.length; i++) {
        fileNames.push(files[i].getName())
      }
      expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1)
      return oc.files.list(config.testFolder)
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
    oc.files.copy(nonExistentFile, '/abcd.txt').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
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
      expect(files[0].getPath()).toEqual(config.testFolder + '/')
      expect(files[0].getSize()).toEqual(11)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method: filter by tag', function (done) {
    const newFile = config.testFolder + '/' + 'fileToTag.txt'
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
    const newFile = config.testFolder + '/' + 'fileToIdentify.txt'

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
    oc.files.delete(config.testFolder).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  describe('TUS detection', function () {
    var parseBodyStub
    var xhr
    var requests

    beforeEach(function () {
      xhr = sinon.useFakeXMLHttpRequest()
      requests = []
      xhr.onCreate = function (xhr) {
        requests.push(xhr)
      }
      const dummyFileInfo1 = new FileInfo('dummy', 'dir', {})
      const dummyFileInfo2 = new FileInfo('dummy2', 'dir', {})
      parseBodyStub = sinon.stub(oc.helpers, '_parseBody').returns([dummyFileInfo1, dummyFileInfo2])
    })

    afterEach(function () {
      parseBodyStub.restore()
      xhr.restore()
    })

    it('returns TUS support information when TUS headers are set for a list call', function (done) {
      const promise = oc.files.list('')
      promise.then(entries => {
        const tusSupport = entries[0].getTusSupport()
        expect(tusSupport.resumable).toEqual('1.0.0')
        expect(tusSupport.version).toEqual(['1.0.0', '0.2.1', '0.1.1'])
        expect(tusSupport.extension).toEqual(['create', 'create-with-upload'])
        expect(tusSupport.maxSize).toEqual(100000000)
        // only the first entry gets the header
        expect(entries[1].getTusSupport()).toEqual(null)
        done()
      })
      requests[0].respond(
        207, {
          'Content-Type': 'application/xml',
          'Tus-Resumable': '1.0.0',
          'Tus-Version': '1.0.0,0.2.1,0.1.1',
          'Tus-Extension': 'create,create-with-upload',
          'Tus-Max-Size': '100000000'
        },
        '<dummy></dummy>' // irrelevant parsing skipped with parseBodyStub
      )
    })
    it('returns TUS support information when TUS headers are set for a fileinfo call', function (done) {
      const promise = oc.files.fileInfo('somedir')
      promise.then(entry => {
        const tusSupport = entry.getTusSupport()
        expect(tusSupport.resumable).toEqual('1.0.0')
        expect(tusSupport.version).toEqual(['1.0.0', '0.2.1', '0.1.1'])
        expect(tusSupport.extension).toEqual(['create', 'create-with-upload'])
        expect(tusSupport.maxSize).toEqual(100000000)
        done()
      })
      requests[0].respond(
        207, {
          'Content-Type': 'application/xml',
          'Tus-Resumable': '1.0.0',
          'Tus-Version': '1.0.0,0.2.1,0.1.1',
          'Tus-Extension': 'create,create-with-upload',
          'Tus-Max-Size': '100000000'
        },
        '<dummy></dummy>' // irrelevant parsing skipped with parseBodyStub
      )
    })
    it('returns null when TUS headers are not set for a list call', function (done) {
      const promise = oc.files.list('')
      promise.then(entries => {
        expect(entries[0].getTusSupport()).toEqual(null)
        expect(entries[1].getTusSupport()).toEqual(null)
        done()
      })
      requests[0].respond(
        207, {
          'Content-Type': 'application/xml'
        },
        '<dummy></dummy>' // irrelevant parsing skipped with parseBodyStub
      )
    })
  })
})
