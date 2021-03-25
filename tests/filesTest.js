// TODO: Enable all tests
// enable all tests once owncloud-sdk is fully compatible with nodejs
// https://github.com/owncloud/owncloud-sdk/issues/705

import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing files management,', function () {
  const config = require('./config/config.json')
  const username = config.adminUsername

  const {
    getContentsOfFileInteraction,
    deleteResourceInteraction,
    webdavExceptionResponseBody,
    resourceNotFoundExceptionMessage,
    webdavPath,
    uriEncodedTestSubFiles,
    testSubFiles,
    validAuthHeaders,
    applicationXmlResponseHeaders,
    getCurrentUserInformationInteraction,
    getCapabilitiesInteraction,
    getAuthHeaders,
    createFolderInteraction,
    updateFileInteraction,
    createOwncloud,
    createProvider,
    getMockServerBaseUrl
  } = require('./pactHelper.js')

  // TESTING CONFIGS
  const { testFolder, testFile, testContent, nonExistentFile, nonExistentDir } = config
  const testSubDir = testFolder + '/' + 'subdir'
  const mockServerBaseUrl = getMockServerBaseUrl()

  const moveFileInteraction = function (provider, requestName, header, response) {
    return provider
      .uponReceiving(`as '${username}', a MOVE request to move existent file into same folder, ${requestName}`)
      .withRequest({
        method: 'MOVE',
        path: webdavPath(`${testFolder}/${encodeURI('中文.txt')}`),
        headers: header
      }).willRespondWith(response)
  }

  const listFolderContentInteraction = function (provider, requestName, parentFolder, items, depth) {
    let response
    if (requestName.includes('non existing')) {
      response = {
        status: 404,
        headers: applicationXmlResponseHeaders,
        body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(parentFolder))
      }
    } else {
      response = {
        status: 207,
        headers: applicationXmlResponseHeaders,
        body: new XmlBuilder('1.0', 'utf-8', 'd:multistatus').build(dMultistatus => {
          dMultistatus.setAttributes({ 'xmlns:d': 'DAV:' })
          dMultistatus
            .appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', `/remote.php/webdav/${parentFolder}/`)
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('d:resourcetype', '', dResourcetype => {
                      dResourcetype.appendElement('d:collection', '', '')
                    })
                      .appendElement('d:quota-used-bytes', '', '55')
                      .appendElement('d:quota-available-bytes', '', '3')
                      .appendElement('d:getetag', '', '&quot;5f8d0ce8c62b5&quot;')
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            })
          listFolderContentResponse(items).map(item => {
            dMultistatus.appendElement('d:response', '', item)
          })
        })
      }
    }

    return provider.uponReceiving(`as '${username}', a PROPFIND request to list content of folder, ${requestName}`)
      .withRequest({
        method: 'PROPFIND',
        path: webdavPath(parentFolder),
        headers: {
          ...validAuthHeaders,
          Depth: depth,
          ...applicationXmlResponseHeaders
        },
        body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
          dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
          dPropfind.appendElement('d:prop', '', '')
        })
      }).willRespondWith(response)
  }

  const listFolderContentResponse = (items) => {
    const response = []
    for (const subFile of items) {
      response.push(node => {
        node
          .appendElement('d:href', '', `/remote.php/webdav/${testFolder}/${subFile}`)
          .appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('d:getlastmodified', '', 'Mon, 19 Oct 2020 03:50:00 GMT')
                .appendElement('d:getcontentlength', '', '11')
                .appendElement('d:resourcetype', '', '')
                .appendElement('d:getetag', '', '&quot;3986cd55c130a4d50ff0904bf64aa27d&quot;')
                .appendElement('d:getcontenttype', '', 'text/plain')
            })
              .appendElement('d:status', '', 'HTTP/1.1 200 OK')
          })
          .appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('d:quota-used-bytes', '', '')
                .appendElement('d:quota-available-bytes', '', '')
            })
              .appendElement('d:status', '', 'HTTP/1.1 404 Not Found')
          })
      })
    }
    return response
  }

  const favoriteFileInteraction = (provider, value) => {
    return provider.uponReceiving(`as '${username}', a PROPPATCH request to ${value === true ? 'favorite' : 'unfavorite'} a file`)
      .withRequest({
        method: 'PROPPATCH',
        path: webdavPath(`${testFolder}/${testFile}`),
        headers: {
          ...validAuthHeaders,
          ...applicationXmlResponseHeaders
        },
        body: new XmlBuilder('1.0', '', 'd:propertyupdate').build(dPropUpdate => {
          dPropUpdate.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
          dPropUpdate.appendElement('d:set', '', dSet => {
            dSet.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:favorite', '', '' + value)
            })
          })
        })
      }).willRespondWith({
        status: 207,
        headers: applicationXmlResponseHeaders,
        body: new XmlBuilder('1.0', 'utf-8', 'd:multistatus').build(dMultistatus => {
          dMultistatus.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:s': 'http://sabredav.org/ns', 'xmlns:oc': 'http://owncloud.org/ns' })
          dMultistatus
            .appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', `/remote.php/webdav/${testFolder}/${testFile}`)
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:favorite', '', '')
                  })
                })
                .appendElement('d:status', '', 'HTTP/1.1 200 OK')
            })
        })
      })
  }

  const getFavoriteStatusInteraction = (provider, value) => {
    return provider.uponReceiving(`as '${username}', a PROPFIND request to propfind file info, favorite  '${value}'`)
      .withRequest({
        method: 'PROPFIND',
        path: webdavPath(`${testFolder}/${testFile}`),
        headers: {
          ...validAuthHeaders,
          ...applicationXmlResponseHeaders
        },
        body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
          dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
          dPropfind.appendElement('d:prop', '', dProp => {
            dProp.appendElement('oc:favorite', '', '')
          })
        })
      }).willRespondWith({
        status: 207,
        headers: applicationXmlResponseHeaders,
        body: new XmlBuilder('1.0', 'utf-8', 'd:multistatus').build(dMultistatus => {
          dMultistatus.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:s': 'http://sabredav.org/ns', 'xmlns:oc': 'http://owncloud.org/ns' })
          dMultistatus
            .appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', `/remote.php/webdav/${testFolder}/${testFile}`)
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:favorite', '', '' + value)
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            })
        })
      })
  }

  describe('file/folder creation and deletion', function () {
    it('creates the testFolder at instance', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await createFolderInteraction(
        provider, testFolder, config.testUser, config.testUserPassword
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.createFolder(testFolder).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('creates subfolder at instance', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(provider, config.testUser, config.testUserPassword)
      await createFolderInteraction(
        provider, testSubDir, config.testUser, config.testUserPassword
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.mkdir(testSubDir).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('creates subfiles at instance', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      for (let i = 0; i < uriEncodedTestSubFiles.length; i++) {
        await updateFileInteraction(
          provider, uriEncodedTestSubFiles[i], config.testUser, config.testUserPassword
        )
      }

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        const promises = testSubFiles.map(file => {
          return oc.files.putFileContents(file, testContent).then(status => {
            expect(typeof status).toBe('object')
            expect(typeof status.ETag).toBe('string')
            expect(typeof status['OC-FileId']).toBe('string')
          }).catch(error => {
            expect(error).toBe(null)
          })
        })
        return Promise.all(promises)
      })
    })

    it('deletes the test folder at instance', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await deleteResourceInteraction(
        provider, testFolder, 'folder', config.testUser, config.testUserPassword
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.delete(testFolder).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })
  })

  describe('list, get content and move file/folder', function () {
    it('checking method : list with no depth specified', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await listFolderContentInteraction(
        provider,
        'test folder, with no depth specified',
        testFolder,
        ['abc.txt', 'file one.txt', 'subdir', 'zz+z.txt', '中文.txt'], '1'
      )
      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.list(testFolder).then(files => {
          expect(typeof (files)).toBe('object')
          expect(files.length).toEqual(6)
          expect(files[1].getName()).toEqual('abc.txt')
          expect(files[2].getName()).toEqual('file one.txt')
          expect(files[3].getName()).toEqual('subdir')
          expect(files[4].getName()).toEqual('zz+z.txt')
          expect(files[5].getName()).toEqual('中文.txt')
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('checking method : list with Infinity depth', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await listFolderContentInteraction(
        provider,
        'test folder, with infinity depth',
        testFolder,
        ['abc.txt', 'file one.txt', 'subdir', 'subdir/in dir.txt', 'zz+z.txt', '中文.txt'], 'infinity'
      )
      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.list(testFolder, 'infinity')
          .then(files => {
            expect(typeof (files)).toBe('object')
            expect(files.length).toEqual(7)
            expect(files[3].getName()).toEqual('subdir')
            expect(files[4].getPath()).toEqual('/' + testFolder + '/' + 'subdir/')
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })

    it('checking method : list with 2 depth', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await listFolderContentInteraction(
        provider,
        'test folder, with 2 depth',
        testFolder,
        ['abc.txt', 'file one.txt', 'subdir', 'subdir/in dir.txt', 'zz+z.txt', '中文.txt'], '2')

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.list(testFolder, 2).then(files => {
          expect(typeof (files)).toBe('object')
          expect(files.length).toEqual(7)
          expect(files[3].getName()).toEqual('subdir')
          expect(files[4].getPath()).toEqual('/' + testFolder + '/' + 'subdir/')
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('checking method : list with non existent file', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await listFolderContentInteraction(
        provider,
        'non existing file',
        nonExistentFile,
        [], '1')
      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.list(nonExistentFile).then(files => {
          expect(files).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        })
      })
    })

    it('checking method : getFileContents for existent files', async function () {
      const provider = createProvider(false, true)

      for (const file of uriEncodedTestSubFiles) {
        await getContentsOfFileInteraction(provider, file, config.testUser, config.testUserPassword)
      }
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(provider, config.testUser, config.testUserPassword)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        for (let i = 0; i < testSubFiles.length; i++) {
          await oc.files.getFileContents(testSubFiles[i], { resolveWithResponseObject: true }).then((resp) => {
            expect(resp.body).toEqual(testContent)
            expect(resp.headers.ETag).toBeDefined()
          }).catch(error => {
            expect(error).toBe(null)
          })
        }
      })
    })

    it('checking method : getFileContents for non existent file', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await getContentsOfFileInteraction(provider, nonExistentFile)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.getFileContents(nonExistentFile).then(content => {
          expect(content).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        })
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
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await updateFileInteraction(provider, newFile)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        try {
          const status = await oc.files.putFileContents(newFile, testContent, options)
          expect(typeof status).toBe('object')

          // Progress callback is not called for nodejs env
          expect(progressCalled).toEqual(typeof window !== 'undefined')
        } catch (error) {
          fail(error)
        }
      })
    })

    it('fails with error when uploading to a non-existent parent path', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await updateFileInteraction(provider, nonExistentDir + '/' + 'file.txt')

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.putFileContents(nonExistentDir + '/' + 'file.txt', testContent).then(status => {
          fail('The request to update non existent file was expected to fail but it passed with status ' + status)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentDir + ' could not be located')
        })
      })
    })

    it('checking method: getFileUrl', function () {
      const oc = createOwncloud()
      const url = oc.files.getFileUrl('/foo/bar')
      expect(url).toBe(mockServerBaseUrl + 'remote.php/webdav/foo/bar')
    })

    it('checking method: getFileUrlV2', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        const url = oc.files.getFileUrlV2('/foo/bar')
        expect(url).toBe(mockServerBaseUrl + 'remote.php/dav/files/' + config.adminUsername + '/foo/bar')
      })
    })

    it('checking method : mkdir for an existing parent path', async function () {
      const newFolder = testFolder + '/' + 'new folder'
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(provider, config.testUser, config.testUserPassword)
      await createFolderInteraction(provider, encodeURI(newFolder), config.testUser, config.testUserPassword)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()

        return oc.files.mkdir(newFolder).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('checking method : mkdir for a non-existent parent path', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await provider
        .uponReceiving(`as '${username}', a MKCOL request to create a folder in a not existing root`)
        .withRequest({
          method: 'MKCOL',
          path: webdavPath(`${testFolder}/${nonExistentDir}/newFolder/`),
          headers: validAuthHeaders
        })
        .willRespondWith({
          status: 409,
          headers: applicationXmlResponseHeaders,
          body: webdavExceptionResponseBody('Conflict', 'Parent node does not exist')
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.mkdir(testFolder + '/' + nonExistentDir + '/newFolder/').then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('Parent node does not exist')
        })
      })
    })

    it('checking method : delete for an existing folder', async function () {
      const newFolder = testSubDir
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await deleteResourceInteraction(
        provider, encodeURI(newFolder), 'folder', config.testUser, config.testUserPassword
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.delete(newFolder)
          .then(status2 => {
            expect(status2).toEqual(true)
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })

    it('checking method : delete for a non-existent folder', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await deleteResourceInteraction(
        provider, encodeURI(nonExistentDir), 'folder', config.testUser, config.testUserPassword
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.delete(nonExistentDir).then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentDir + ' could not be located')
        })
      })
    })

    it('checking method : move existent file into same folder, same name', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await moveFileInteraction(
        provider,
        'same name',
        {
          ...validAuthHeaders,
          Destination: `${mockServerBaseUrl}remote.php/webdav/testFolder/%E4%B8%AD%E6%96%87.txt`
        },
        {
          status: 403,
          headers: applicationXmlResponseHeaders,
          body: webdavExceptionResponseBody('Forbidden', 'Source and destination uri are identical.')
        })
      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error.message).toBe('Source and destination uri are identical.')
        })
      })
    })

    it('checking method : move existent file into different folder', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const encodedSrcFilePath = `${testFolder}/${encodeURI('中文.txt')}`
      const destinationWebDavPath = `remote.php/webdav/${testFolder}/${encodeURI('中文123.txt')}`
      provider
        .given('the user is recreated', {
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file exists', {
          fileName: encodedSrcFilePath,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('provider base url is returned')
        .uponReceiving(`as '${username}', a MOVE request to move existent file into different folder`)
        .withRequest({
          method: 'MOVE',
          path: webdavPath(encodedSrcFilePath),
          headers: {
            authorization: getAuthHeaders(config.testUser, config.testUserPassword),
            Destination: MatchersV3.fromProviderState(
              `\${providerBaseURL}/${destinationWebDavPath}`,
              `${mockServerBaseUrl}${destinationWebDavPath}`
            )
          }
        })
        .willRespondWith({
          status: 201
        })
      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.move(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('checking method : move non existent file', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await provider
        .uponReceiving(`as '${username}', a MOVE request to move non existent file`)
        .withRequest({
          method: 'MOVE',
          path: webdavPath(nonExistentFile),
          headers: {
            ...validAuthHeaders,
            Destination: `${mockServerBaseUrl}remote.php/webdav/abcd.txt`
          }
        })
        .willRespondWith({
          status: 404,
          headers: applicationXmlResponseHeaders,
          body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(nonExistentFile))
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.move(nonExistentFile, '/abcd.txt').then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        })
      })
    })

    it('checking method : copy existent file into same folder, same name', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await provider
        .uponReceiving(`as '${username}', a COPY request to copy existent file into same folder, same name`)
        .withRequest({
          method: 'COPY',
          path: webdavPath(`${testFolder}/${encodeURI('中文.txt')}`),
          headers: {
            ...validAuthHeaders,
            Destination: `${mockServerBaseUrl}remote.php/webdav/${testFolder}/${encodeURI('中文.txt')}`
          }
        })
        .willRespondWith({
          status: 403,
          headers: applicationXmlResponseHeaders,
          body: webdavExceptionResponseBody('Forbidden', 'Source and destination uri are identical.')
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error.message).toBe('Source and destination uri are identical.')
        })
      })
    })

    it('checking method : copy non existent file', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await provider
        .uponReceiving(`as '${username}', a COPY request to copy non existent file`)
        .withRequest({
          method: 'COPY',
          path: webdavPath(nonExistentFile),
          headers: {
            ...validAuthHeaders,
            Destination: `${mockServerBaseUrl}remote.php/webdav/abcd.txt`
          }
        })
        .willRespondWith({
          status: 404,
          headers: applicationXmlResponseHeaders,
          body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(nonExistentFile))
        })
      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.copy(nonExistentFile, '/abcd.txt').then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        })
      })
    })

    it('resolved the path of a file identified by its fileId', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await provider
        .uponReceiving(`as '${username}', a PROPFIND request to path for fileId`)
        .withRequest({
          method: 'PROPFIND',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/meta\\/123456789',
            '/remote.php/dav/meta/123456789'
          ),
          headers: {
            ...validAuthHeaders,
            ...applicationXmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
            dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            dPropfind.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:meta-path-for-user', '', '')
            })
          })
        })
        .willRespondWith({
          status: 207,
          headers: applicationXmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', '/remote.php/dav/meta/123456789/')
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:meta-path-for-user', '', `/${testFolder}/${testFile}`)
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            })
          })
        })

      await provider
        .uponReceiving(`as '${username}', a PROPFIND request to file info, fileId`)
        .withRequest({
          method: 'PROPFIND',
          path: webdavPath(`${testFolder}/${testFile}`),
          headers: {
            ...validAuthHeaders,
            ...applicationXmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
            dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            dPropfind.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:fileid', '', '')
            })
          })
        })
        .willRespondWith({
          status: 207,
          headers: applicationXmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', '/remote.php/dav/meta/123456789/')
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:fileid', '', '123456789')
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            })
          })
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        const newFile = testFolder + '/' + testFile
        return oc.files.fileInfo(newFile, ['{http://owncloud.org/ns}fileid'])
          .then(fileInfo => {
            const fileId = fileInfo.getFileId()
            return oc.files.getPathForFileId(fileId)
          }).then(path => {
            expect(path).toEqual('/' + newFile)
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })
  })

  describe('TUS detection', function () {
    const tusSupportRequest = (provider, enabled = true, path = '/') => {
      let respHeaders = applicationXmlResponseHeaders
      if (enabled) {
        respHeaders = {
          ...respHeaders,
          ...applicationXmlResponseHeaders,
          'Tus-Resumable': '1.0.0',
          'Tus-Version': '1.0.0,0.2.1,0.1.1',
          'Tus-Extension': 'create,create-with-upload',
          'Tus-Max-Size': '100000000'
        }
      }
      const description = `as '${username}', a PROPFIND request for tus support with tus ${enabled ? 'enabled' : 'disabled'} for path ${path}`
      return provider
        .uponReceiving(description)
        .withRequest({
          method: 'PROPFIND',
          path: webdavPath(path),
          headers: {
            ...validAuthHeaders,
            ...applicationXmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
            dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            dPropfind.appendElement('d:prop', '', '')
          })
        })
        .willRespondWith({
          status: 207,
          headers: respHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', '/remote.php/dav/files/admin' + path)
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('d:quota-available-bytes', '', '-3')
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            }).appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', '/remote.php/dav/files/admin/' + path + 'file1')
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:fileid', '', '123456789')
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            })
          })
        })
    }

    it('returns TUS support information when TUS headers are set for a list call', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await tusSupportRequest(provider)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()

        const promise = oc.files.list('')
        await promise.then(entries => {
          const tusSupport = entries[0].getTusSupport()
          expect(tusSupport.resumable).toEqual('1.0.0')
          expect(tusSupport.version).toEqual(['1.0.0', '0.2.1', '0.1.1'])
          expect(tusSupport.extension).toEqual(['create', 'create-with-upload'])
          expect(tusSupport.maxSize).toEqual(100000000)
          // only the first entry gets the header
          expect(entries[1].getTusSupport()).toEqual(null)
        })
      })
    })

    it('returns TUS support information when TUS headers are set for a fileinfo call', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await tusSupportRequest(provider, true, 'somedir')

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        const promise = oc.files.fileInfo('somedir')
        return promise.then(entry => {
          const tusSupport = entry.getTusSupport()
          expect(tusSupport.resumable).toEqual('1.0.0')
          expect(tusSupport.version).toEqual(['1.0.0', '0.2.1', '0.1.1'])
          expect(tusSupport.extension).toEqual(['create', 'create-with-upload'])
          expect(tusSupport.maxSize).toEqual(100000000)
        })
      })
    })

    it('returns null when TUS headers are not set for a list call', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await tusSupportRequest(provider, false)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        const promise = oc.files.list('')
        return promise.then(entries => {
          expect(entries[0].getTusSupport()).toEqual(null)
          expect(entries[1].getTusSupport()).toEqual(null)
        })
      })
    })
  })

  describe('rename existing file', function () {
    it('rename existing file', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const encodedSrcFilePath = `${testFolder}/${encodeURI('中文.txt')}`
      const destinationWebDavPath = `remote.php/webdav/${testFolder}/${encodeURI('中文123.txt')}`
      provider
        .given('the user is recreated', {
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file exists', {
          fileName: encodedSrcFilePath,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('provider base url is returned')
      await moveFileInteraction(
        provider,
        'different name',
        {
          authorization: getAuthHeaders(config.testUser, config.testUserPassword),
          Destination: MatchersV3.fromProviderState(
            `\${providerBaseURL}/${destinationWebDavPath}`,
            `${mockServerBaseUrl}${destinationWebDavPath}`
          )
        },
        {
          status: 201
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.move(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })
  })

  describe('copy existent file', function () {
    it('checking method : copy existent file into same folder, different name', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const encodedSrcFilePath = `${testFolder}/${encodeURI('中文.txt')}`
      const destinationWebDavPath = `remote.php/webdav/${testFolder}/${encodeURI('中文123.txt')}`
      await provider
        .given('the user is recreated', {
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file exists', {
          fileName: encodedSrcFilePath,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('provider base url is returned')
        .uponReceiving(`as '${username}', a COPY request to copy existent file into same folder, different name`)
        .withRequest({
          method: 'COPY',
          path: webdavPath(encodedSrcFilePath),
          headers: {
            authorization: getAuthHeaders(config.testUser, config.testUserPassword),
            Destination: MatchersV3.fromProviderState(
              `\${providerBaseURL}/${destinationWebDavPath}`,
              `${mockServerBaseUrl}${destinationWebDavPath}`
            )
          }
        })
        .willRespondWith({
          status: 201
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('checking method : copy existent file into different folder', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await provider
      const encodedSrcFilePath = `${testFolder}/${encodeURI('中文.txt')}`
      const destinationWebDavPath = `remote.php/webdav/${testFolder}/subdir/${encodeURI('中文123.txt')}`
      await provider
        .given('the user is recreated', {
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file exists', {
          fileName: encodedSrcFilePath,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('folder exists', {
          folderName: `${testFolder}/subdir/`,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('provider base url is returned')
        .uponReceiving(`as '${username}', a COPY request to copy existent file into different folder`)
        .withRequest({
          method: 'COPY',
          path: webdavPath(encodedSrcFilePath),
          headers: {
            authorization: getAuthHeaders(config.testUser, config.testUserPassword),
            Destination: MatchersV3.fromProviderState(
              `\${providerBaseURL}/${destinationWebDavPath}`,
              `${mockServerBaseUrl}${destinationWebDavPath}`
            )
          }
        })
        .willRespondWith({
          status: 201
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.copy(testFolder + '/中文.txt', testFolder + '/subdir/中文123.txt').then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })
  })

  describe('unfavorite a file', function () {
    it('checking method: unfavorite', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await favoriteFileInteraction(provider, false)
      await getFavoriteStatusInteraction(provider, 0)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.favorite(`${testFolder}/${testFile}`, false)
          .then(status => {
            expect(status).toEqual(true)
            return oc.files.fileInfo(`${testFolder}/${testFile}`, ['{http://owncloud.org/ns}favorite'])
          }).then(fileInfo => {
            expect(fileInfo.getProperty('{http://owncloud.org/ns}favorite')).toEqual('0')
          }).catch(error => {
            fail(error)
          })
      })
    })
  })

  describe('favorite, search file', function () {
    let fileId = 123456789
    let tagId = 6789

    it('checking method: favorite', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await favoriteFileInteraction(provider, true)
      await getFavoriteStatusInteraction(provider, 1)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.favorite(`${testFolder}/${testFile}`)
          .then(status => {
            expect(status).toEqual(true)
            return oc.files.fileInfo(`${testFolder}/${testFile}`, ['{http://owncloud.org/ns}favorite'])
          }).then(fileInfo => {
            expect(fileInfo.getProperty('{http://owncloud.org/ns}favorite')).toEqual('1')
          }).catch(error => {
            fail(error)
          })
      })
    })

    it('checking method: favorite filter', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await favoriteFileInteraction(provider, true)
      await provider
        .uponReceiving(`as '${username}', a REPORT request to get favorite file`)
        .withRequest({
          method: 'REPORT',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/files\\/' + config.adminUsername + '\\/$',
            '/remote.php/dav/files/' + config.adminUsername + '/'
          ),
          headers: {
            ...validAuthHeaders,
            ...applicationXmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'oc:filter-files').build(ocFilterFiles => {
            ocFilterFiles.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            ocFilterFiles.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:favorite', '', '')
            }).appendElement('oc:filter-rules', '', ocFilterRules => {
              ocFilterRules.appendElement('oc:favorite', '', '1')
            })
          })
        })
        .willRespondWith({
          status: 207,
          headers: applicationXmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', '/remote.php/dav/files/' + config.adminUsername + '/testFile.txt')
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:favorite', '', '1')
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            })
          })
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.favorite(`${testFolder}/${testFile}`)
          .then(status => {
            expect(status).toEqual(true)
            return oc.files.getFavoriteFiles(['{http://owncloud.org/ns}favorite'])
          }).then(files => {
            expect(files.length).toEqual(1)
            expect(files[0].getProperty('{http://owncloud.org/ns}favorite')).toEqual('1')
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })

    it('searches in the instance', async function () {
      const davProperties = [
        '{http://owncloud.org/ns}favorite',
        '{DAV:}getcontentlength',
        '{http://owncloud.org/ns}size',
        '{DAV:}getlastmodified',
        '{DAV:}resourcetype'
      ]

      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)

      await provider
        .uponReceiving(`as '${username}', a REPORT request to search in the instance`)
        .withRequest({
          method: 'REPORT',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/files\\/' + config.adminUsername + '\\/$',
            '/remote.php/dav/files/' + config.adminUsername + '/'
          ),
          headers: {
            ...validAuthHeaders,
            ...applicationXmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'oc:search-files').build(ocSearchFiles => {
            ocSearchFiles.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            ocSearchFiles.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:favorite', '', '')
                .appendElement('d:getcontentlength', '', '')
                .appendElement('oc:size', '', '')
                .appendElement('d:getlastmodified', '', '')
                .appendElement('d:resourcetype', '', '')
            }).appendElement('oc:search', '', ocSearch => {
              ocSearch.appendElement('oc:pattern', '', 'abc')
                .appendElement('oc:limit', '', 30)
            })
          })
        })
        .willRespondWith({
          status: 207,
          headers: applicationXmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', '/remote.php/dav/files/' + config.adminUsername + '/' + testFolder + '/abc.txt')
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp
                      .appendElement('oc:favorite', '', '0')
                      .appendElement('d:getcontentlength', '', '6')
                      .appendElement('oc:size', '', '6')
                      .appendElement('d:getlastmodified', '', 'Wed, 21 Oct 2020 11:20:54 GMT')
                      .appendElement('d:resourcetype', '', '')
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            })
          })
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.files.search('abc', 30, davProperties).then(files => {
          expect(typeof (files)).toBe('object')
          expect(files.length).toEqual(1)
          expect(files[0].getName()).toEqual('abc.txt')
          expect(files[0].getPath()).toEqual('/' + testFolder + '/')
          expect(files[0].getSize()).toEqual(6)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('checking method: filter by tag', async function () {
      const newFile = testFolder + '/' + testFile
      const newTagName = 'testSystemTag12345'
      const getFileInfoBy = data => {
        return {
          status: 207,
          headers: applicationXmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', `/remote.php/${data === fileId ? 'webdav' : 'dav/files/' + config.adminUsername}/${testFolder}/${testFile}`)
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp
                      .appendElement('oc:fileid', '', fileId)
                  })
                    .appendElement('d:status', '', 'HTTP/1.1 200 OK')
                })
            })
          })
        }
      }
      const provider = createProvider(true, true)

      await provider
        .uponReceiving(`as '${username}', a POST request to create tag`)
        .withRequest({
          method: 'POST',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/systemtags',
            '/remote.php/dav/systemtags'
          ),
          headers: {
            ...validAuthHeaders,
            'Content-Type': 'application/json'
          },
          body: { canAssign: true, name: newTagName, userAssignable: true, userEditable: true, userVisible: true }
        })
        .willRespondWith({
          status: 201,
          headers: {
            ...applicationXmlResponseHeaders,
            'Access-Control-Expose-Headers': 'Content-Location,DAV,ETag,Link,Lock-Token,OC-ETag,OC-Checksum,OC-FileId,OC-JobStatus-Location,Vary,Webdav-Location,X-Sabre-Status',
            'Content-Location': `/remote.php/dav/systemtags/${tagId}`
          }
        })
      await provider
        .uponReceiving(`as '${username}', a PROPFIND request to file info, fileId`)
        .withRequest({
          method: 'PROPFIND',
          path: webdavPath(`${testFolder}/${testFile}`),
          headers: {
            ...validAuthHeaders,
            ...applicationXmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
            dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            dPropfind.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:fileid', '', '')
            })
          })
        })
        .willRespondWith(getFileInfoBy('fileId'))

      await provider
        .uponReceiving(`as '${username}', a PUT request to tag file`)
        .withRequest({
          method: 'PUT',
          path: MatchersV3.regex(
            `.*\\/remote\\.php\\/dav\\/systemtags-relations\\/files\\/${fileId}\\/${tagId}`,
            `/remote.php/dav/systemtags-relations/files/${fileId}/${tagId}`
          ),
          headers: validAuthHeaders
        })
        .willRespondWith({
          status: 201,
          headers: applicationXmlResponseHeaders
        })

      await provider
        .uponReceiving(`as '${username}', a REPORT request to get files by tag`)
        .withRequest({
          method: 'REPORT',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/files\\/' + config.adminUsername + '\\/$',
            '/remote.php/dav/files/' + config.adminUsername + '/'
          ),
          headers: {
            ...validAuthHeaders,
            ...applicationXmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'oc:filter-files').build(ocFilterFiles => {
            ocFilterFiles.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            ocFilterFiles.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:fileid', '', '')
            }).appendElement('oc:filter-rules', '', ocFilterRules => {
              ocFilterRules.appendElement('oc:systemtag', '', tagId)
            })
          })
        })
        .willRespondWith(getFileInfoBy('tag'))

      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()

        return oc.files.fileInfo(newFile, ['{http://owncloud.org/ns}fileid'])
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
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })
  })
})
