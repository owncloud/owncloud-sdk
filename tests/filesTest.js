describe('Main: Currently testing files management,', function () {
  const FileInfo = require('../src/fileInfo')
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')
  const sinon = require('sinon')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    getContentsOfFile,
    deleteResource,
    webdavExceptionResponseBody,
    resourceNotFoundExceptionMessage,
    webdavPath,
    uriEncodedTestSubFiles,
    testSubFiles,
    validAuthHeaders,
    xmlResponseAndAccessControlCombinedHeader,
    CORSPreflightRequest,
    GETRequestToCloudUserEndpoint,
    capabilitiesGETRequestValidAuth,
    createAFolder,
    updateFile,
    pactCleanup
  } = require('./pactHelper.js')

  // TESTING CONFIGS
  const { testFolder, testFile, testContent, nonExistentFile, nonExistentDir, owncloudURL, username, password } = config
  const testSubDir = testFolder + '/' + 'subdir'

  const aMoveRequest = function (name, header, response) {
    return {
      uponReceiving: 'move existent file into same folder, ' + name,
      withRequest: {
        method: 'MOVE',
        path: webdavPath(`${testFolder}/${encodeURI('中文.txt')}`),
        headers: header
      },
      willRespondWith: response
    }
  }

  const aPropfindRequestToListContentOfFolder = function (name, parentFolder, items, depth) {
    return {
      uponReceiving: 'list content of folder, ' + name,
      withRequest: {
        method: 'PROPFIND',
        path: webdavPath(parentFolder),
        headers: {
          ...validAuthHeaders,
          Depth: depth
        },
        body: '<?xml version="1.0"?>\n' +
          '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
          '  <d:prop>\n' +
          '  </d:prop>\n' +
          '</d:propfind>'
      },
      willRespondWith: !name.includes('non existing') ? {
        status: 207,
        headers: xmlResponseAndAccessControlCombinedHeader,
        body: '<?xml version="1.0"?>\n' +
          '<d:multistatus\n' +
          'xmlns:d="DAV:"\n' +
          'xmlns:s="http://sabredav.org/ns"\n' +
          'xmlns:oc="http://owncloud.org/ns">\n' +
          '<d:response>\n' +
          `<d:href>/remote.php/webdav/${parentFolder}/</d:href>\n` +
          '<d:propstat>\n' +
          '<d:prop>\n' +
          '<d:resourcetype>\n' +
          '<d:collection/>\n' +
          '</d:resourcetype>\n' +
          '<d:quota-used-bytes>55</d:quota-used-bytes>\n' +
          '<d:quota-available-bytes>-3</d:quota-available-bytes>\n' +
          '<d:getetag>&quot;5f8d0ce8c62b5&quot;</d:getetag>\n' +
          '</d:prop>\n' +
          '<d:status>HTTP/1.1 200 OK</d:status>\n' +
          '</d:propstat>\n' +
          '</d:response>\n' +
          `${listFolderContentResponse(items).join('')}` +
          '</d:multistatus>'
      } : {
        status: 404,
        headers: xmlResponseAndAccessControlCombinedHeader,
        body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(parentFolder))
      }
    }
  }

  const listFolderContentResponse = (items) => {
    const response = []
    for (const subFile of items) {
      response.push('<d:response>\n' +
        `<d:href>/remote.php/webdav/${testFolder}/${subFile}</d:href>\n` +
        '<d:propstat>\n' +
        '<d:prop>\n' +
        '<d:getlastmodified>Mon, 19 Oct 2020 03:50:00 GMT</d:getlastmodified>\n' +
        '<d:getcontentlength>11</d:getcontentlength>\n' +
        '<d:resourcetype/>\n' +
        '<d:getetag>&quot;3986cd55c130a4d50ff0904bf64aa27d&quot;</d:getetag>\n' +
        '<d:getcontenttype>text/plain</d:getcontenttype>\n' +
        '</d:prop>\n' +
        '<d:status>HTTP/1.1 200 OK</d:status>\n' +
        '</d:propstat>\n' +
        '<d:propstat>\n' +
        '<d:prop>\n' +
        '<d:quota-used-bytes/>\n' +
        '<d:quota-available-bytes/>\n' +
        '</d:prop>\n' +
        '<d:status>HTTP/1.1 404 Not Found</d:status>\n' +
        '</d:propstat>\n' +
        '</d:response>\n')
    }
    return response
  }

  const favoriteFile = value => {
    return {
      uponReceiving: value === true ? 'favorite' : 'unfavorite',
      withRequest: {
        method: 'PROPPATCH',
        path: webdavPath(`${testFolder}/${testFile}`),
        headers: validAuthHeaders,
        body: '<?xml version="1.0"?>\n' +
          '<d:propertyupdate  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
          '  <d:set>\n' +
          '   <d:prop>\n' +
          `      <oc:favorite>${value}</oc:favorite>\n` +
          '    </d:prop>\n' +
          '  </d:set>\n' +
          '</d:propertyupdate>'
      },
      willRespondWith: {
        status: 207,
        headers: {
          ...xmlResponseAndAccessControlCombinedHeader,
          'Access-Control-Expose-Headers': 'Content-Location,DAV,ETag,Link,Lock-Token,OC-ETag,OC-Checksum,OC-FileId,OC-JobStatus-Location,Vary,Webdav-Location,X-Sabre-Status'
        },
        body: '<?xml version="1.0"?>\n' +
          '<d:multistatus\n' +
          '    xmlns:d="DAV:"\n' +
          '    xmlns:s="http://sabredav.org/ns"\n' +
          '    xmlns:oc="http://owncloud.org/ns">\n' +
          '    <d:response>\n' +
          `        <d:href>/remote.php/webdav/${testFolder}/${testFile}</d:href>\n` +
          '        <d:propstat>\n' +
          '            <d:prop>\n' +
          '                <oc:favorite/>\n' +
          '            </d:prop>\n' +
          '            <d:status>HTTP/1.1 200 OK</d:status>\n' +
          '        </d:propstat>\n' +
          '    </d:response>\n' +
          '</d:multistatus>'
      }
    }
  }

  const propfindFavoriteFileInfo = value => {
    return {
      uponReceiving: 'propfind file info, favorite ' + value,
      withRequest: {
        method: 'PROPFIND',
        path: webdavPath(`${testFolder}/${testFile}`),
        headers: validAuthHeaders,
        body: '<?xml version="1.0"?>\n' +
          '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
          '  <d:prop>\n' +
          '    <oc:favorite />\n' +
          '  </d:prop>\n' +
          '</d:propfind>'
      },
      willRespondWith: {
        status: 207,
        headers: xmlResponseAndAccessControlCombinedHeader,
        body: '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
          '   <d:response>\n' +
          `      <d:href>/remote.php/webdav/${testFolder}/${testFile}</d:href>\n` +
          '      <d:propstat>\n' +
          '         <d:prop>\n' +
          `            <oc:favorite>${value}</oc:favorite>\n` +
          '         </d:prop>\n' +
          '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
          '      </d:propstat>\n' +
          '   </d:response>\n' +
          '</d:multistatus>'
      }
    }
  }

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: owncloudURL,
      auth: {
        basic: {
          username: username,
          password: password
        }
      }
    })

    return oc.login().then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
    }).catch(error => {
      expect(error).toBe(null)
    })
  })

  afterEach(function () {
    oc.logout()
    oc = null
  })

  describe('file/folder creation and deletion', function () {
    beforeAll(function () {
      return Promise.all([
        ...uriEncodedTestSubFiles.map(file => provider.addInteraction(updateFile(file))),
        provider.addInteraction(CORSPreflightRequest()),
        provider.addInteraction(capabilitiesGETRequestValidAuth()),
        provider.addInteraction(GETRequestToCloudUserEndpoint()),
        provider.addInteraction(createAFolder())
      ])
    })

    afterAll(function () {
      return pactCleanup(provider)
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

    it('deletes the test folder at instance', async function (done) {
      await provider.addInteraction(deleteResource(testFolder))
      oc.files.delete(testFolder).then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })
  })

  describe('list, get content and move file/folder', function () {
    beforeAll(function () {
      const promises = []

      const updateFiles = [
        config.testFolder + '/' + config.testFile,
        config.nonExistentDir + '/file.txt'
      ]
      const updateInteractions = updateFiles.map(file => provider.addInteraction(updateFile(file)))

      promises.concat([
        ...updateInteractions,
        provider.addInteraction(CORSPreflightRequest()),
        provider.addInteraction(capabilitiesGETRequestValidAuth()),
        provider.addInteraction(GETRequestToCloudUserEndpoint()),
        provider.addInteraction(createAFolder())
      ])

      promises.push(provider.addInteraction(aPropfindRequestToListContentOfFolder(
        'test folder, with no depth specified',
        testFolder,
        ['abc.txt', 'file one.txt', 'subdir', 'zz+z.txt', '中文.txt'], '1')))
      promises.push(provider.addInteraction(aPropfindRequestToListContentOfFolder(
        'test folder, with infinity depth',
        testFolder,
        ['abc.txt', 'file one.txt', 'subdir', 'subdir/in dir.txt', 'zz+z.txt', '中文.txt'], 'infinity')))

      promises.push(provider.addInteraction(aPropfindRequestToListContentOfFolder(
        'test folder, with 2 depth',
        testFolder,
        ['abc.txt', 'file one.txt', 'subdir', 'subdir/in dir.txt', 'zz+z.txt', '中文.txt'], '2')))
      promises.push(provider.addInteraction(aPropfindRequestToListContentOfFolder(
        'non existing file',
        nonExistentFile,
        [], '1')))
      return Promise.all(promises)
    })

    afterAll(function () {
      return pactCleanup(provider)
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
        expect(files[4].getPath()).toEqual('/' + testFolder + '/' + 'subdir/')
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
        expect(files[4].getPath()).toEqual('/' + testFolder + '/' + 'subdir/')
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method : list with non existent file', async function (done) {
      oc.files.list(nonExistentFile).then(files => {
        expect(files).toBe(null)
        done()
      }).catch(error => {
        expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        done()
      })
    })

    it('checking method : getFileContents for existent files', async function (done) {
      let count = 0
      for (const file of uriEncodedTestSubFiles) {
        await provider.addInteraction(getContentsOfFile(file))
      }
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

    it('checking method : getFileContents for non existent file', async function (done) {
      await provider.addInteraction(getContentsOfFile(nonExistentFile))
      oc.files.getFileContents(nonExistentFile).then(content => {
        expect(content).toBe(null)
        done()
      }).catch(error => {
        expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        done()
      })
    })

    it('uploads file for an existing parent path', async function () {
      const newFile = testFolder + '/' + testFile
      let progressCalled = false

      const options = {
        onProgress: (progressInfo) => {
          progressCalled = true
        }
      }

      try {
        const status = await oc.files.putFileContents(newFile, testContent, options)
        expect(typeof status).toBe('object')
        expect(progressCalled).toEqual(true)
      } catch (error) {
        fail(error)
      }
    })

    it('fails with error when uploading to a non-existent parent path', function (done) {
      oc.files.putFileContents(nonExistentDir + '/' + 'file.txt', testContent).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.message).toBe('File with name ' + nonExistentDir + ' could not be located')
        done()
      })
    })

    it('checking method: getFileUrl', function () {
      const url = oc.files.getFileUrl('/foo/bar')
      expect(url).toBe(owncloudURL + 'remote.php/webdav/foo/bar')
    })

    it('checking method: getFileUrlV2', function () {
      const url = oc.files.getFileUrlV2('/foo/bar')
      expect(url).toBe(owncloudURL + 'remote.php/dav/files/admin/foo/bar')
    })

    it('checking method : mkdir for an existing parent path', async function (done) {
      const newFolder = testFolder + '/' + 'new folder'

      oc.files.mkdir(newFolder).then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method : mkdir for a non-existent parent path', async function (done) {
      await provider.addInteraction({
        uponReceiving: 'creating a folder in a not existing root',
        withRequest: {
          method: 'MKCOL',
          path: webdavPath(`${testFolder}/${nonExistentDir}/newFolder/`),
          headers: validAuthHeaders
        },
        willRespondWith: {
          status: 409,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': origin
          },
          body: webdavExceptionResponseBody('Conflict', 'Parent node does not exist')
        }
      })
      oc.files.mkdir(testFolder + '/' + nonExistentDir + '/newFolder/').then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.message).toBe('Parent node does not exist')
        done()
      })
    })

    it('checking method : delete for an existing file', async function (done) {
      const newFolder = testSubDir
      await provider.addInteraction(deleteResource(encodeURI(newFolder)))

      oc.files.delete(newFolder)
        .then(status2 => {
          expect(status2).toEqual(true)
          done()
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
    })

    it('checking method : delete for a non-existent file', async function (done) {
      await provider.addInteraction(deleteResource(encodeURI(nonExistentDir)))
      oc.files.delete(nonExistentDir).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.message).toBe('File with name ' + nonExistentDir + ' could not be located')
        done()
      })
    })

    it('checking method : move existent file into same folder, same name', async function (done) {
      await provider.addInteraction(aMoveRequest(
        'same name',
        {
          ...validAuthHeaders,
          Destination: `${owncloudURL}remote.php/webdav/testFolder/%E4%B8%AD%E6%96%87.txt`
        },
        {
          status: 403,
          headers: xmlResponseAndAccessControlCombinedHeader,
          body: webdavExceptionResponseBody('Forbidden', 'Source and destination uri are identical.')
        }))
      oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error.message).toBe('Source and destination uri are identical.')
        done()
      })
    })

    it('checking method : move existent file into different folder', async function (done) {
      await provider.addInteraction({
        uponReceiving: 'move existent file into different folder',
        withRequest: {
          method: 'MOVE',
          path: webdavPath(`${testFolder}/${encodeURI('中文123.txt')}`),
          headers: {
            ...validAuthHeaders,
            Destination: `${owncloudURL}remote.php/webdav/${testFolder}/${encodeURI('中文.txt')}`
          }
        },
        willRespondWith: {
          status: 201,
          headers: xmlResponseAndAccessControlCombinedHeader
        }
      })

      oc.files.move(testFolder + '/中文123.txt', testFolder + '/中文.txt').then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method : move non existent file', async function (done) {
      await provider.addInteraction({
        uponReceiving: 'move non existent file',
        withRequest: {
          method: 'MOVE',
          path: webdavPath(nonExistentFile),
          headers: {
            ...validAuthHeaders,
            Destination: `${owncloudURL}remote.php/webdav/abcd.txt`
          }
        },
        willRespondWith: {
          status: 404,
          headers: xmlResponseAndAccessControlCombinedHeader,
          body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(nonExistentFile))
        }
      })
      oc.files.move(nonExistentFile, '/abcd.txt').then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        done()
      })
    })

    it('checking method : copy existent file into same folder, same name', async function (done) {
      await provider.addInteraction({
        uponReceiving: 'copy existent file into same folder, same name',
        withRequest: {
          method: 'COPY',
          path: webdavPath(`${testFolder}/${encodeURI('中文.txt')}`),
          headers: {
            ...validAuthHeaders,
            Destination: `${owncloudURL}remote.php/webdav/${testFolder}/${encodeURI('中文.txt')}`
          }
        },
        willRespondWith: {
          status: 403,
          headers: xmlResponseAndAccessControlCombinedHeader,
          body: webdavExceptionResponseBody('Forbidden', 'Source and destination uri are identical.')
        }
      })

      oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error.message).toBe('Source and destination uri are identical.')
        done()
      })
    })

    it('checking method : copy non existent file', async function (done) {
      await provider.addInteraction({
        uponReceiving: 'copy non existent file',
        withRequest: {
          method: 'COPY',
          path: webdavPath(nonExistentFile),
          headers: {
            ...validAuthHeaders,
            Destination: `${owncloudURL}remote.php/webdav/abcd.txt`
          }
        },
        willRespondWith: {
          status: 404,
          headers: xmlResponseAndAccessControlCombinedHeader,
          body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(nonExistentFile))
        }
      })

      oc.files.copy(nonExistentFile, '/abcd.txt').then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        done()
      })
    })

    it('resolved the path of a file identified by its fileId', async function (done) {
      await provider.addInteraction({
        uponReceiving: 'PROPFIND path for fileId',
        withRequest: {
          method: 'PROPFIND',
          path: Pact.Matchers.term({
            matcher: '.*\\/remote\\.php\\/dav\\/meta\\/123456789',
            generate: '/remote.php/dav/meta/123456789'
          }),
          headers: validAuthHeaders,
          body: '<?xml version="1.0"?>\n' +
            '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
            '  <d:prop>\n' +
            '    <oc:meta-path-for-user />\n' +
            '  </d:prop>\n' +
            '</d:propfind>'
        },
        willRespondWith: {
          status: 207,
          headers: xmlResponseAndAccessControlCombinedHeader,
          body: '<?xml version="1.0"?>\n' +
            '<d:multistatus\n' +
            '    xmlns:d="DAV:"\n' +
            '    xmlns:s="http://sabredav.org/ns"\n' +
            '    xmlns:oc="http://owncloud.org/ns">\n' +
            '    <d:response>\n' +
            '        <d:href>/remote.php/dav/meta/123456789/</d:href>\n' +
            '        <d:propstat>\n' +
            '            <d:prop>\n' +
            `                <oc:meta-path-for-user>/${testFolder}/${testFile}</oc:meta-path-for-user>\n` +
            '            </d:prop>\n' +
            '            <d:status>HTTP/1.1 200 OK</d:status>\n' +
            '        </d:propstat>\n' +
            '    </d:response>\n' +
            '</d:multistatus>'
        }
      })

      await provider.addInteraction({
        uponReceiving: 'PROPFIND file info, fileId',
        withRequest: {
          method: 'PROPFIND',
          path: webdavPath(`${testFolder}/${testFile}`),
          headers: validAuthHeaders,
          body: '<?xml version="1.0"?>\n' +
            '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
            '  <d:prop>\n' +
            '    <oc:fileid />\n' +
            '  </d:prop>\n' +
            '</d:propfind>'
        },
        willRespondWith: {
          status: 207,
          headers: xmlResponseAndAccessControlCombinedHeader,
          body: '<?xml version="1.0"?>\n' +
            '<d:multistatus\n' +
            '    xmlns:d="DAV:"\n' +
            '    xmlns:s="http://sabredav.org/ns"\n' +
            '    xmlns:oc="http://owncloud.org/ns">\n' +
            '    <d:response>\n' +
            `        <d:href>/remote.php/webdav/${testFolder}/${testFile}</d:href>\n` +
            '        <d:propstat>\n' +
            '            <d:prop>\n' +
            '                <oc:fileid>123456789</oc:fileid>\n' +
            '            </d:prop>\n' +
            '            <d:status>HTTP/1.1 200 OK</d:status>\n' +
            '        </d:propstat>\n' +
            '    </d:response>\n' +
            '</d:multistatus>'
        }
      })

      const newFile = testFolder + '/' + testFile
      oc.files.fileInfo(newFile, ['{http://owncloud.org/ns}fileid'])
        .then(fileInfo => {
          const fileId = fileInfo.getFileId()
          return oc.files.getPathForFileId(fileId)
        }).then(path => {
          expect(path).toEqual('/' + newFile)
          done()
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
    })
  })

  xdescribe('TUS detection', function () {
    let parseBodyStub
    let xhr
    let requests

    beforeAll(async function () {
      const promises = []
      promises.concat([
        provider.addInteraction(CORSPreflightRequest()),
        provider.addInteraction(capabilitiesGETRequestValidAuth()),
        provider.addInteraction(GETRequestToCloudUserEndpoint())
      ])

      return Promise.all(promises)
    })

    afterAll(function () {
      return pactCleanup(provider)
    })

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

  describe('move existent file into same folder, different name', function () {
    beforeAll(async function () {
      const promises = [
        provider.addInteraction(CORSPreflightRequest()),
        provider.addInteraction(capabilitiesGETRequestValidAuth()),
        provider.addInteraction(GETRequestToCloudUserEndpoint())
      ]
      return Promise.all(promises)
    })

    afterAll(function () {
      return pactCleanup(provider)
    })

    it('checking method : move existent file into same folder, different name', async function (done) {
      await provider.addInteraction(aMoveRequest(
        'different name',
        {
          ...validAuthHeaders,
          Destination: `${owncloudURL}remote.php/webdav/testFolder/%E4%B8%AD%E6%96%87123.txt`
        },
        {
          status: 201,
          headers: xmlResponseAndAccessControlCombinedHeader
        }))
      oc.files.move(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })
  })

  describe('copy existent file', function () {
    beforeAll(async function () {
      const promises = [
        provider.addInteraction(CORSPreflightRequest()),
        provider.addInteraction(capabilitiesGETRequestValidAuth()),
        provider.addInteraction(GETRequestToCloudUserEndpoint())
      ]
      return Promise.all(promises)
    })

    afterAll(function () {
      return pactCleanup(provider)
    })

    it('checking method : copy existent file into same folder, different name', async function (done) {
      await provider.addInteraction({
        uponReceiving: 'copy existent file into same folder, different name',
        withRequest: {
          method: 'COPY',
          path: webdavPath(`${testFolder}/${encodeURI('中文.txt')}`),
          headers: {
            ...validAuthHeaders,
            Destination: `${owncloudURL}remote.php/webdav/${testFolder}/${encodeURI('中文123.txt')}`
          }
        },
        willRespondWith: {
          status: 201,
          headers: xmlResponseAndAccessControlCombinedHeader
        }
      })

      oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method : copy existent file into different folder', async function (done) {
      await provider.addInteraction({
        uponReceiving: 'copy existent file into different folder',
        withRequest: {
          method: 'COPY',
          path: webdavPath(`${testFolder}/${encodeURI('中文123.txt')}`),
          headers: {
            ...validAuthHeaders,
            Destination: `${owncloudURL}remote.php/webdav/${testFolder}/subdir/${encodeURI('中文.txt')}`
          }
        },
        willRespondWith: {
          status: 201,
          headers: xmlResponseAndAccessControlCombinedHeader
        }
      })

      oc.files.copy(testFolder + '/中文123.txt', testFolder + '/subdir/中文.txt').then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })
  })

  describe('unfavorite a file', function () {
    beforeAll(function () {
      const promises = [
        provider.addInteraction(CORSPreflightRequest()),
        provider.addInteraction(capabilitiesGETRequestValidAuth()),
        provider.addInteraction(GETRequestToCloudUserEndpoint())
      ]
      return Promise.all(promises)
    })

    afterAll(function () {
      return pactCleanup(provider)
    })

    it('checking method: unfavorite', async function (done) {
      await provider.addInteraction(favoriteFile(false))
      await provider.addInteraction(propfindFavoriteFileInfo(0))
      oc.files.favorite(`${testFolder}/${testFile}`, false)
        .then(status => {
          expect(status).toEqual(true)
          return oc.files.fileInfo(`${testFolder}/${testFile}`, ['{http://owncloud.org/ns}favorite'])
        }).then(fileInfo => {
          expect(fileInfo.getProperty('{http://owncloud.org/ns}favorite')).toEqual('0')
          done()
        }).catch(error => {
          fail(error)
          done()
        })
    })
  })

  describe('favorite, search file', function () {
    let fileId = 123456789
    let tagId = 6789

    beforeAll(function () {
      const promises = [
        provider.addInteraction(CORSPreflightRequest()),
        provider.addInteraction(capabilitiesGETRequestValidAuth()),
        provider.addInteraction(GETRequestToCloudUserEndpoint())
      ]
      promises.push(provider.addInteraction(favoriteFile(true)))
      promises.push(provider.addInteraction(propfindFavoriteFileInfo(1)))
      return Promise.all(promises)
    })

    afterAll(function () {
      return pactCleanup(provider)
    })

    it('checking method: favorite', function (done) {
      oc.files.favorite(`${testFolder}/${testFile}`)
        .then(status => {
          expect(status).toEqual(true)
          return oc.files.fileInfo(`${testFolder}/${testFile}`, ['{http://owncloud.org/ns}favorite'])
        }).then(fileInfo => {
          expect(fileInfo.getProperty('{http://owncloud.org/ns}favorite')).toEqual('1')
          done()
        }).catch(error => {
          fail(error)
          done()
        })
    })

    it('checking method: favorite filter', async function (done) {
      await provider.addInteraction({
        uponReceiving: 'get favorite file',
        withRequest: {
          method: 'REPORT',
          path: Pact.Matchers.regex({
            matcher: '.*\\/remote\\.php\\/dav\\/files\\/admin\\/$',
            generate: '/remote.php/dav/files/admin/'
          }),
          headers: validAuthHeaders,
          body: '<?xml version="1.0"?>\n' +
            '<oc:filter-files  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
            '  <d:prop>\n' +
            '    <oc:favorite />\n' +
            '  </d:prop>\n' +
            '<oc:filter-rules>\n' +
            '<oc:favorite>1</oc:favorite>\n' +
            '</oc:filter-rules>\n' +
            '</oc:filter-files>'
        },
        willRespondWith: {
          status: 207,
          headers: xmlResponseAndAccessControlCombinedHeader,
          body: '<?xml version="1.0"?>\n' +
            '<d:multistatus\n' +
            '    xmlns:d="DAV:"\n' +
            '    xmlns:s="http://sabredav.org/ns"\n' +
            '    xmlns:oc="http://owncloud.org/ns">\n' +
            '    <d:response>\n' +
            '        <d:href>/remote.php/dav/files/admin/testFile.txt</d:href>\n' +
            '        <d:propstat>\n' +
            '            <d:prop>\n' +
            '                <oc:favorite>1</oc:favorite>\n' +
            '            </d:prop>\n' +
            '            <d:status>HTTP/1.1 200 OK</d:status>\n' +
            '        </d:propstat>\n' +
            '    </d:response>\n' +
            '</d:multistatus>'
        }
      })

      oc.files.favorite(`${testFolder}/${testFile}`)
        .then(status => {
          expect(status).toEqual(true)
          return oc.files.getFavoriteFiles(['{http://owncloud.org/ns}favorite'])
        }).then(files => {
          expect(files.length).toEqual(1)
          expect(files[0].getProperty('{http://owncloud.org/ns}favorite')).toEqual('1')
          done()
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
    })

    it('searches in the instance', async function (done) {
      const davProperties = [
        '{http://owncloud.org/ns}favorite',
        '{DAV:}getcontentlength',
        '{http://owncloud.org/ns}size',
        '{DAV:}getlastmodified',
        '{DAV:}resourcetype'
      ]

      await provider.addInteraction({
        uponReceiving: 'searches in the instance',
        withRequest: {
          method: 'REPORT',
          path: Pact.Matchers.term({
            matcher: '.*\\/remote\\.php\\/dav\\/files\\/admin\\/$',
            generate: '/remote.php/dav/files/admin/'
          }),
          headers: validAuthHeaders,
          body: '<?xml version="1.0"?>\n' +
            '<oc:search-files  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
            '  <d:prop>\n' +
            '    <oc:favorite />\n' +
            '    <d:getcontentlength />\n' +
            '    <oc:size />\n' +
            '    <d:getlastmodified />\n' +
            '    <d:resourcetype />\n' +
            '  </d:prop>\n' +
            '  <oc:search>\n' +
            '    <oc:pattern>abc</oc:pattern>\n' +
            '    <oc:limit>30</oc:limit>\n' +
            '  </oc:search>\n' +
            '</oc:search-files>'
        },
        willRespondWith: {
          status: 207,
          headers: xmlResponseAndAccessControlCombinedHeader,
          body: '<?xml version="1.0"?>\n' +
            '<d:multistatus\n' +
            '    xmlns:d="DAV:"\n' +
            '    xmlns:s="http://sabredav.org/ns"\n' +
            '    xmlns:oc="http://owncloud.org/ns">\n' +
            '    <d:response>\n' +
            '        <d:href>/remote.php/dav/files/admin/testFolder/abc.txt</d:href>\n' +
            '        <d:propstat>\n' +
            '            <d:prop>\n' +
            '                <oc:favorite>0</oc:favorite>\n' +
            '                <d:getcontentlength>6</d:getcontentlength>\n' +
            '                <oc:size>6</oc:size>\n' +
            '                <d:getlastmodified>Wed, 21 Oct 2020 11:20:54 GMT</d:getlastmodified>\n' +
            '                <d:resourcetype/>\n' +
            '            </d:prop>\n' +
            '            <d:status>HTTP/1.1 200 OK</d:status>\n' +
            '        </d:propstat>\n' +
            '    </d:response>\n' +
            '</d:multistatus>'
        }
      })

      oc.files.search('abc', 30, davProperties).then(files => {
        expect(typeof (files)).toBe('object')
        expect(files.length).toEqual(1)
        expect(files[0].getName()).toEqual('abc.txt')
        expect(files[0].getPath()).toEqual('/' + testFolder + '/')
        expect(files[0].getSize()).toEqual(6)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method: filter by tag', async function (done) {
      const newFile = testFolder + '/' + testFile
      const newTagName = 'testSystemTag12345'
      const getFileInfoBy = data => {
        return {
          status: 207,
          headers: xmlResponseAndAccessControlCombinedHeader,
          body: '<?xml version="1.0"?>\n' +
            '<d:multistatus\n' +
            '    xmlns:d="DAV:"\n' +
            '    xmlns:s="http://sabredav.org/ns"\n' +
            '    xmlns:oc="http://owncloud.org/ns">\n' +
            '    <d:response>\n' +
            `        <d:href>/remote.php/${data === 'fileId' ? 'webdav' : 'dav/files/admin'}/${testFolder}/${testFile}</d:href>\n` +
            '        <d:propstat>\n' +
            '            <d:prop>\n' +
            `                <oc:fileid>${fileId}</oc:fileid>\n` +
            '            </d:prop>\n' +
            '            <d:status>HTTP/1.1 200 OK</d:status>\n' +
            '        </d:propstat>\n' +
            '    </d:response>\n' +
            '</d:multistatus>'
        }
      }

      await provider.addInteraction({
        uponReceiving: 'create Tag',
        withRequest: {
          method: 'POST',
          path: Pact.Matchers.term({
            matcher: '.*\\/remote\\.php\\/dav\\/systemtags',
            generate: '/remote.php/dav/systemtags'
          }),
          headers: {
            ...validAuthHeaders,
            'Content-Type': 'application/json'
          },
          body: { canAssign: true, name: newTagName, userAssignable: true, userEditable: true, userVisible: true }
        },
        willRespondWith: {
          status: 201,
          headers: {
            ...xmlResponseAndAccessControlCombinedHeader,
            'Access-Control-Expose-Headers': 'Content-Location,DAV,ETag,Link,Lock-Token,OC-ETag,OC-Checksum,OC-FileId,OC-JobStatus-Location,Vary,Webdav-Location,X-Sabre-Status',
            'Content-Location': `/remote.php/dav/systemtags/${tagId}`
          }
        }
      })

      await provider.addInteraction({
        uponReceiving: 'PROPFIND file info, fileId',
        withRequest: {
          method: 'PROPFIND',
          path: webdavPath(`${testFolder}/${testFile}`),
          headers: validAuthHeaders,
          body: '<?xml version="1.0"?>\n' +
            '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
            '  <d:prop>\n' +
            '    <oc:fileid />\n' +
            '  </d:prop>\n' +
            '</d:propfind>'
        },
        willRespondWith: getFileInfoBy('fileId')
      })

      await provider.addInteraction({
        uponReceiving: 'tag file',
        withRequest: {
          method: 'PUT',
          path: Pact.Matchers.term({
            matcher: `.*\\/remote\\.php\\/dav\\/systemtags-relations\\/files\\/${fileId}\\/${tagId}`,
            generate: `/remote.php/dav/systemtags-relations/files/${fileId}/${tagId}`
          }),
          headers: validAuthHeaders
        },
        willRespondWith: {
          status: 201,
          headers: xmlResponseAndAccessControlCombinedHeader
        }
      })

      await provider.addInteraction({
        uponReceiving: 'get files by tag',
        withRequest: {
          method: 'REPORT',
          path: Pact.Matchers.regex({
            matcher: '.*\\/remote\\.php\\/dav\\/files\\/admin\\/$',
            generate: '/remote.php/dav/files/admin/'
          }),
          headers: validAuthHeaders,
          body: '<?xml version="1.0"?>\n' +
            '<oc:filter-files  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
            '  <d:prop>\n' +
            '    <oc:fileid />\n' +
            '  </d:prop>\n' +
            `<oc:filter-rules><oc:systemtag>${tagId}</oc:systemtag></oc:filter-rules></oc:filter-files>`
        },
        willRespondWith: getFileInfoBy('tag')
      })

      oc.files.fileInfo(newFile, ['{http://owncloud.org/ns}fileid'])
        .then(fileInfo => {
          fileId = fileInfo.getFileId()
          return oc.systemTags.createTag({ name: newTagName })
        }).then(resp => {
          tagId = resp
          return oc.systemTags.tagFile(fileId, tagId)
        }).then(() => {
          return oc.files.getFilesByTags([tagId], ['{http://owncloud.org/ns}fileid'])
        }).then(files => {
          expect(files.length).toEqual(1)
          expect(files[0].getName()).toEqual(testFile)
          done()
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
    })
  })
})
