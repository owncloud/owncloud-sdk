// TODO: Review all matchers in xml once the issue is fixed
// https://github.com/pact-foundation/pact-js/issues/632

import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing files management,', function () {
  const config = require('./config/config.json')
  const username = config.testUser

  const {
    getContentsOfFileInteraction,
    deleteResourceInteraction,
    webdavExceptionResponseBody,
    resourceNotFoundExceptionMessage,
    webdavPath,
    testSubFiles,
    xmlResponseHeaders,
    getCurrentUserInformationInteraction,
    getCapabilitiesInteraction,
    getAuthHeaders,
    createFolderInteraction,
    updateFileInteraction,
    createOwncloud,
    createProvider,
    getMockServerBaseUrl
  } = require('./helpers/pactHelper.js')

  const {
    givenUserExists,
    givenFileExists,
    givenFileIsMarkedFavorite,
    givenSystemTagExists,
    givenTagIsAssignedToFile,
    givenFolderExists
  } = require('./helpers/providerStateHelper')
  const validAuthHeaders = { authorization: getAuthHeaders(config.testUser, config.testUserPassword) }

  // TESTING CONFIGS
  const { testFolder, testFile, testContent, nonExistentFile, nonExistentDir } = config
  const testSubDir = testFolder + '/' + 'subdir'
  const mockServerBaseUrl = getMockServerBaseUrl()

  const moveFileInteraction = function (provider, requestName, header, response) {
    return provider
      .uponReceiving(`as '${username}', a MOVE request to move existent file into same folder, ${requestName}`)
      .withRequest({
        method: 'MOVE',
        path: webdavPath(`${testFolder}/中文.txt`, username),
        headers: header
      }).willRespondWith(response)
  }

  const listFolderContentInteraction = async function (provider, requestName, parentFolder, files, folders, depth) {
    const items = []
    items.push(...files.map(item => { return { name: item, type: 'file' } }))
    items.push(...folders.map(item => { return { name: item, type: 'folder' } }))

    items.sort((a, b) => (a.name > b.name) ? 1 : -1)
    let response
    if (requestName.includes('non existing')) {
      response = {
        status: 404,
        headers: xmlResponseHeaders,
        body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(parentFolder))
      }
    } else {
      response = {
        status: 207,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', 'utf-8', 'd:multistatus').build(dMultistatus => {
          dMultistatus.setAttributes({ 'xmlns:d': 'DAV:' })
          dMultistatus
            .appendElement('d:response', '', dResponse => {
              dResponse.appendElement(
                'd:href', '',
                MatchersV3.regex(
                  `.*\\/remote\\.php\\/dav\\/files\\/${username}\\/${parentFolder}\\/`,
                  `/remote.php/dav/files/${username}/${parentFolder}/`
                )
              )
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('d:resourcetype', '', dResourcetype => {
                      dResourcetype.appendElement('d:collection', '', '')
                    })
                      .appendElement('d:getetag', '',
                        MatchersV3.regex(
                          '"[a-z0-9]+"',
                          '"5f8d0ce8c62b5"'
                        )
                      )
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            })
          listFolderContentResponse(items).map(item => {
            dMultistatus.appendElement('d:response', '', item)
          })
        })
      }
    }

    await givenUserExists(provider, config.testUser, config.testUserPassword)
    if (parentFolder !== nonExistentFile) {
      for (let i = 0; i < files.length; i++) {
        await givenFileExists(provider, config.testUser, config.testUserPassword, parentFolder + '/' + files[i])
      }
    }
    if (parentFolder !== nonExistentFile) {
      for (let i = 0; i < folders.length; i++) {
        await givenFolderExists(provider, config.testUser, config.testUserPassword, parentFolder + '/' + folders[i])
      }
    }
    return provider.uponReceiving(`as '${username}', a PROPFIND request to list content of folder, ${requestName}`)
      .withRequest({
        method: 'PROPFIND',
        path: webdavPath(parentFolder, username),
        headers: {
          ...validAuthHeaders,
          Depth: depth,
          ...xmlResponseHeaders
        },
        body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
          dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
          dPropfind.appendElement('d:prop', '', '')
        })
      }).willRespondWith(response)
  }

  const listFolderContentResponse = (items) => {
    const response = []

    for (const item of items) {
      let resourceType = ''

      if (item.type === 'folder') {
        resourceType = dResourcetype => {
          dResourcetype.appendElement('d:collection', '', '')
        }
      }
      response.push(node => {
        node
          .appendElement(
            'd:href', '',
            MatchersV3.regex(
              `.*\\/remote\\.php\\/dav\\/files\\/${username}\\/${testFolder}\\/${item.name}(\\/)?`,
              `/remote.php/dav/files/${username}/${testFolder}/${item.name}`
            )
          )
          .appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement(
                  'd:getlastmodified', '',
                  MatchersV3.date('EEE, d MMM yyyy HH:mm:ss z', 'Mon, 19 Oct 2020 03:50:00 GMT')
                )
                .appendElement('d:resourcetype', '', resourceType)
                .appendElement(
                  'd:getetag', '',
                  MatchersV3.regex(
                    '"[a-z0-9]+"',
                    '"3986cd55c130a4d50ff0904bf64aa27d"'
                  )
                )
              if (item.type === 'file') {
                dProp
                  .appendElement('d:getcontentlength', '', MatchersV3.number(11))
                  .appendElement('d:getcontenttype', '',
                    MatchersV3.regex('text\\/plain(; charset=utf-8)?', 'text/plain')
                  )
              }
            })
              .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
          })
      })
    }
    return response
  }

  const favoriteFileInteraction = async (provider, value, file) => {
    await givenUserExists(provider, config.testUser, config.testUserPassword)
    await givenFileExists(provider, config.testUser, config.testUserPassword, file)
    return provider.uponReceiving(`as '${username}', a PROPPATCH request to ${value === true ? 'favorite' : 'unfavorite'} a file`)
      .withRequest({
        method: 'PROPPATCH',
        path: webdavPath(file, username),
        headers: {
          ...validAuthHeaders,
          ...xmlResponseHeaders
        },
        body: new XmlBuilder('1.0', '', 'd:propertyupdate').build(dPropUpdate => {
          dPropUpdate.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
          dPropUpdate.appendElement('d:set', '', dSet => {
            dSet.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:favorite', '', MatchersV3.equal('' + value))
            })
          })
        })
      }).willRespondWith({
        status: 207,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', 'utf-8', 'd:multistatus').build(dMultistatus => {
          dMultistatus.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:s': 'http://sabredav.org/ns', 'xmlns:oc': 'http://owncloud.org/ns' })
          dMultistatus
            .appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '',
                MatchersV3.regex(`.*\\/remote\\.php\\/dav\\/files\\/${username}\\/${file}`, `/remote.php/dav/files/${username}/${file}`)
              )
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:favorite', '', '')
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            })
        })
      })
  }

  describe('file/folder creation and deletion', function () {
    it('creates the testFolder at instance', async function () {
      const provider = createProvider()
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
        return oc.files.createFolder(`files/${config.testUser}/${testFolder}`).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('creates subfolder at instance', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(provider, config.testUser, config.testUserPassword)
      await createFolderInteraction(
        provider, testSubDir, config.testUser, config.testUserPassword
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.createFolder(`files/${config.testUser}/${testSubDir}`).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('creates subfiles at instance', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      for (let i = 0; i < testSubFiles.length; i++) {
        await updateFileInteraction(
          provider, testSubFiles[i], config.testUser, config.testUserPassword
        )
      }

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        const promises = testSubFiles.map(file => {
          return oc.files.putFileContents(`files/${config.testUser}/${file}`, testContent).then(status => {
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
      const provider = createProvider()
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
        return oc.files.delete(`files/${config.testUser}/${testFolder}`).then(status => {
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
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await listFolderContentInteraction(
        provider,
        'test folder, with no depth specified',
        testFolder,
        ['abc.txt', 'file one.txt', 'zz+z.txt', '中文.txt'], ['subdir'], '1'
      )
      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.list(`files/${config.testUser}/${testFolder}`).then(files => {
          expect(typeof (files)).toBe('object')
          expect(files.length).toEqual(6)
          expect(files[1].getName()).toEqual('abc.txt')
          expect(files[2].getName()).toEqual('file one.txt')
          expect(files[3].getName()).toEqual('subdir')
          expect(files[3].isDir()).toBe(true)
          expect(files[4].getName()).toEqual('zz+z.txt')
          expect(files[4].isDir()).toBe(false)
          expect(files[5].getName()).toEqual('中文.txt')
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    // [oCIS] request to non-existing file gives empty response body
    // https://github.com/owncloud/ocis/issues/1799
    it('checking method : list with non existent file', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await listFolderContentInteraction(
        provider,
        'non existing file',
        nonExistentFile,
        [], [], '1')
      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.list(`files/${config.testUser}/${nonExistentFile}`).then(files => {
          expect(files).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        })
      })
    })

    it('checking method : getFileContents for existent files', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(provider, config.testUser, config.testUserPassword)
      for (const file of testSubFiles) {
        await getContentsOfFileInteraction(provider, file, config.testUser, config.testUserPassword)
      }

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        for (let i = 0; i < testSubFiles.length; i++) {
          await oc.files.getFileContents(`files/${config.testUser}/${testSubFiles[i]}`, { resolveWithResponseObject: true }).then((resp) => {
            expect(resp.body).toEqual(testContent)
            expect(resp.headers.ETag).toBeDefined()
          }).catch(error => {
            expect(error).toBe(null)
          })
        }
      })
    })

    // [oCIS] request to non-existing file gives empty response body
    // https://github.com/owncloud/ocis/issues/1799
    it('checking method : getFileContents for non existent file', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getContentsOfFileInteraction(provider, nonExistentFile, config.testUser, config.testUserPassword)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.getFileContents(`files/${config.testUser}/${nonExistentFile}`).then(content => {
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
        onProgress: () => {
          progressCalled = true
        }
      }
      const provider = createProvider()
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await updateFileInteraction(provider, newFile, config.testUser, config.testUserPassword)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        try {
          const status = await oc.files.putFileContents(`files/${config.testUser}/${newFile}`, testContent, options)
          expect(typeof status).toBe('object')

          // Progress callback is not called for nodejs env
          expect(progressCalled).toEqual(typeof window !== 'undefined')
        } catch (error) {
          fail(error)
        }
      })
    })

    // [oCIS] Not-meaningful response message when tyring to PUT file into non-existing folder
    // https://github.com/owncloud/ocis/issues/1264
    it('fails with error when uploading to a non-existent parent path', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await updateFileInteraction(provider, nonExistentDir + '/' + 'file.txt', config.testUser, config.testUserPassword)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.putFileContents(`files/${config.testUser}/${nonExistentDir}/file.txt`, testContent).then(status => {
          fail('The request to update non existent file was expected to fail but it passed with status ' + status)
        }).catch(error => {
          expect(error.message).toBe('Files cannot be created in non-existent collections')
        })
      })
    })

    it('checking method: getFileUrl', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        const url = oc.files.getFileUrl(`files/${config.testUser}/foo/bar`)
        expect(url).toBe(mockServerBaseUrl + 'remote.php/dav/files/' + config.testUser + '/foo/bar')
      })
    })

    it('checking method : createFolder for an existing parent path', async function () {
      const newFolder = testFolder + '/' + 'new folder'
      const provider = createProvider()
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(provider, config.testUser, config.testUserPassword)
      await createFolderInteraction(provider, newFolder, config.testUser, config.testUserPassword)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()

        return oc.files.createFolder(`files/${config.testUser}/${newFolder}`).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    // [oCIS] request to non-existing file gives empty response body
    // https://github.com/owncloud/ocis/issues/1799
    it('checking method : createFolder for a non-existent parent path', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await provider
        .uponReceiving(`as '${username}', a MKCOL request to create a folder in a not existing root`)
        .withRequest({
          method: 'MKCOL',
          path: webdavPath(`${testFolder}/${nonExistentDir}/newFolder/`, username),
          headers: validAuthHeaders
        })
        .willRespondWith({
          status: 409,
          headers: xmlResponseHeaders,
          body: webdavExceptionResponseBody('Conflict', 'Parent node does not exist')
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.createFolder(`files/${config.testUser}/${testFolder}/${nonExistentDir}/newFolder/`).then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('Parent node does not exist')
        })
      })
    })

    it('checking method : delete for an existing folder', async function () {
      const newFolder = testSubDir
      const provider = createProvider()
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await deleteResourceInteraction(
        provider, newFolder, 'folder', config.testUser, config.testUserPassword
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.delete(`files/${config.testUser}/${newFolder}`)
          .then(status2 => {
            expect(status2).toEqual(true)
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })

    // [oCIS] request to non-existing file gives empty response body
    // https://github.com/owncloud/ocis/issues/1799
    it('checking method : delete for a non-existent folder', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await deleteResourceInteraction(
        provider, nonExistentDir, 'folder', config.testUser, config.testUserPassword
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.delete(`files/${config.testUser}/${nonExistentDir}`).then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentDir + ' could not be located')
        })
      })
    })

    // [oCIS] Moving a file into same folder with same name returns 404 instead of 403
    // https://github.com/owncloud/ocis/issues/1976
    it('checking method : move existent file into same folder, same name', async function () {
      const encodedSrcFilePath = `${testFolder}/${encodeURI('中文.txt')}`
      const destinationWebDavPath = `remote.php/dav/files/${username}/${encodedSrcFilePath}`

      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
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
        'same name',
        {
          ...validAuthHeaders,
          Destination: MatchersV3.fromProviderState(
            `\${providerBaseURL}/${destinationWebDavPath}`,
            `${mockServerBaseUrl}${destinationWebDavPath}`
          )
        },
        {
          status: 403,
          headers: xmlResponseHeaders,
          body: webdavExceptionResponseBody('Forbidden', 'Source and destination uri are identical.')
        })
      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.move(`files/${config.testUser}/${testFolder}/中文.txt`, `files/${config.testUser}/${testFolder}/中文.txt`).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error.message).toBe('Source and destination uri are identical.')
        })
      })
    })

    it('checking method : move existent file into different folder', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const srcFilePath = `${testFolder}/中文.txt`
      const desFolder = 'testFolder2'
      const desFilePath = `${desFolder}/中文.txt`
      const destinationWebDavPath = `remote.php/dav/files/${username}/${encodeURI(desFilePath)}`
      provider
        .given('the user is recreated', {
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('folder exists', {
          folderName: desFolder,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file exists', {
          fileName: srcFilePath,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('provider base url is returned')
        .uponReceiving(`as '${username}', a MOVE request to move existent file into different folder`)
        .withRequest({
          method: 'MOVE',
          path: webdavPath(srcFilePath, username),
          headers: {
            ...validAuthHeaders,
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
        return oc.files.move(`files/${config.testUser}/${testFolder}/中文.txt`, `files/${config.testUser}/${testFolder}/中文123.txt`).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    // [oCIS] request to non-existing file gives empty response body
    // https://github.com/owncloud/ocis/issues/1799
    it('checking method : move non existent file', async function () {
      const destinationWebDavPath = `remote.php/dav/files/${username}/abcd.txt`
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await provider
        .given('provider base url is returned')
        .uponReceiving(`as '${username}', a MOVE request to move non existent file`)
        .withRequest({
          method: 'MOVE',
          path: webdavPath(nonExistentFile, username),
          headers: {
            ...validAuthHeaders,
            Destination: MatchersV3.fromProviderState(
              `\${providerBaseURL}/${destinationWebDavPath}`,
              `${mockServerBaseUrl}${destinationWebDavPath}`
            )
          }
        })
        .willRespondWith({
          status: 404,
          headers: xmlResponseHeaders,
          body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(nonExistentFile))
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.move(`files/${config.testUser}/${nonExistentFile}`, '/abcd.txt').then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        })
      })
    })

    // [oCIS] COPY a file into same folder with same name returns 204 instead of 403
    // https://github.com/owncloud/ocis/issues/1977
    it('checking method : copy existent file into same folder, same name', async function () {
      const file = `${testFolder}/中文.txt`
      const destinationWebDavPath = `remote.php/dav/files/${username}/${testFolder}/${encodeURI('中文.txt')}`
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, file)
      await provider
        .given('provider base url is returned')
        .uponReceiving(`as '${username}', a COPY request to copy existent file into same folder, same name`)
        .withRequest({
          method: 'COPY',
          path: webdavPath(`${testFolder}/中文.txt`, username),
          headers: {
            ...validAuthHeaders,
            Destination: MatchersV3.fromProviderState(
              `\${providerBaseURL}/${destinationWebDavPath}`,
              `${mockServerBaseUrl}${destinationWebDavPath}`
            )
          }
        })
        .willRespondWith({
          status: 403,
          headers: xmlResponseHeaders,
          body: webdavExceptionResponseBody('Forbidden', 'Source and destination uri are identical.')
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.copy(`files/${config.testUser}/${file}`, `files/${config.testUser}/${file}`).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error.message).toBe('Source and destination uri are identical.')
        })
      })
    })

    // [oCIS] request to non-existing file gives empty response body
    // https://github.com/owncloud/ocis/issues/1799
    it('checking method : copy non existent file', async function () {
      const destinationWebDavPath = `remote.php/dav/files/${username}/abcd.txt`
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await provider
        .given('provider base url is returned')
        .uponReceiving(`as '${username}', a COPY request to copy non existent file`)
        .withRequest({
          method: 'COPY',
          path: webdavPath(nonExistentFile, username),
          headers: {
            ...validAuthHeaders,
            Destination: MatchersV3.fromProviderState(
              `\${providerBaseURL}/${destinationWebDavPath}`,
              `${mockServerBaseUrl}${destinationWebDavPath}`
            )
          }
        })
        .willRespondWith({
          status: 404,
          headers: xmlResponseHeaders,
          body: webdavExceptionResponseBody('NotFound', resourceNotFoundExceptionMessage(nonExistentFile))
        })
      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.copy(`files/${config.testUser}/${nonExistentFile}`, `files/${config.testUser}/abcd.txt`).then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('File with name ' + nonExistentFile + ' could not be located')
        })
      })
    })

    // [oCIS] Requests to webdav /meta/endpoint with valid fileId returns 404 Not Found
    // https://github.com/owncloud/ocis/issues/1978
    it('resolved the path of a file identified by its fileId', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const file = `${testFolder}/${testFile}`
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, file)
      await provider
        .uponReceiving(`as '${username}', a PROPFIND request to path for fileId`)
        .withRequest({
          method: 'PROPFIND',
          path: MatchersV3.fromProviderState(
            '/remote.php/dav/meta/${fileId}', /* eslint-disable-line no-template-curly-in-string */
            '/remote.php/dav/meta/123456789'
          ),
          headers: {
            ...validAuthHeaders,
            ...xmlResponseHeaders
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
          headers: xmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '',
                MatchersV3.regex(
                  '.*\\/remote\\.php\\/dav\\/meta\\/[a-z0-9]+\\/',
                  '/remote.php/dav/meta/123456789/'
                )
              )
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:meta-path-for-user', '', MatchersV3.equal(`/${file}`))
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            })
          })
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.getPathForFileId('123456789')
          .then(path => {
            expect(path).toEqual('/' + file)
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })

    it('checking method: file info', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const file = `${testFolder}/${testFile}`
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, file)
      await provider
        .uponReceiving(`as '${username}', a PROPFIND request to file info, fileId`)
        .withRequest({
          method: 'PROPFIND',
          path: webdavPath(file, username),
          headers: {
            ...validAuthHeaders,
            ...xmlResponseHeaders
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
          headers: xmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '',
                MatchersV3.regex(
                  `.*\\/remote\\.php\\/dav\\/files\\/${username}\\/${file}`,
                  `/remote.php/dav/files/${username}/${file}`
                )
              )
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:fileid', '', MatchersV3.string('123456789'))
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            })
          })
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.fileInfo(`files/${config.testUser}/${file}`, ['{http://owncloud.org/ns}fileid'])
          .then(fileInfo => {
            const fileId = fileInfo.getFileId()
            expect(fileId).toEqual('123456789')
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })
  })

  // TUS protocol not implemented in oC10
  describe('TUS detection', function () {
    const tusSupportRequest = async (provider, enabled = true, path = '/') => {
      let respHeaders = xmlResponseHeaders
      if (enabled) {
        respHeaders = {
          ...respHeaders,
          'Tus-Resumable': '1.0.0',
          'Tus-Version': '1.0.0',
          'Tus-extension': 'creation,creation-with-upload'
        }
      }

      const description = `as '${username}', a PROPFIND request for tus support with tus ${enabled ? 'enabled' : 'disabled'} for path ${path}`

      let examplePath = path
      if (path !== '/') {
        examplePath = '/' + path + '/'
      }
      const regexPath = examplePath.replace(/\//g, '\\\\/')

      return provider
        .uponReceiving(description)
        .withRequest({
          method: 'PROPFIND',
          path: webdavPath(path, username),
          headers: {
            ...validAuthHeaders,
            ...xmlResponseHeaders
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
              dResponse.appendElement('d:href', '',
                MatchersV3.regex(
                  `.*\\/remote\\.php\\/dav\\/files\\/${username}${regexPath}`,
                  `/remote.php/dav/files/${username}${examplePath}`
                )
              )
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('d:getetag', '',
                      MatchersV3.regex(
                        '"[a-z0-9]+"',
                        '"3986cd55c130a4d50ff0904bf64aa27d"'
                      )
                    )
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            }).appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '',
                MatchersV3.regex(
                  `.*\\/remote\\.php\\/dav\\/files\\/${username}${regexPath}${config.testFile}`,
                  `/remote.php/dav/files/${username}${examplePath}${config.testFile}`
                )
              )
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('d:getcontenttype', '',
                      MatchersV3.regex('text\\/plain(; charset=utf-8)?', 'text/plain')
                    )
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            })
          })
        })
    }

    it('returns TUS support information when TUS headers are set for a list call', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, config.testFile)
      await tusSupportRequest(provider)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()

        const promise = oc.files.list(`files/${config.testUser}/`)
        await promise.then(entries => {
          const tusSupport = entries[0].getTusSupport()
          expect(tusSupport.resumable).toEqual('1.0.0')
          expect(tusSupport.version).toEqual(['1.0.0'])
          expect(tusSupport.extension).toEqual(['creation', 'creation-with-upload'])
          // only the first entry gets the header
          expect(entries[1].getTusSupport()).toEqual(null)
        })
      })
    })

    it('returns TUS support information when TUS headers are set for a fileinfo call', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const dir = 'somedir'
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFolderExists(provider, config.testUser, config.testUserPassword, dir)
      await givenFileExists(provider, config.testUser, config.testUserPassword, dir + '/' + config.testFile)
      await tusSupportRequest(provider, true, dir)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        const promise = oc.files.fileInfo(`files/${config.testUser}/${dir}`)
        return promise.then(entry => {
          const tusSupport = entry.getTusSupport()
          expect(tusSupport.resumable).toEqual('1.0.0')
          expect(tusSupport.version).toEqual(['1.0.0'])
          expect(tusSupport.extension).toEqual(['creation', 'creation-with-upload'])
        })
      })
    })

    it('returns null when TUS headers are not set for a list call', async function () {
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, config.testFile)
      await tusSupportRequest(provider, false)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        const promise = oc.files.list(`files/${config.testUser}/`)
        return promise.then(entries => {
          expect(entries[0].getTusSupport()).toEqual(null)
          expect(entries[1].getTusSupport()).toEqual(null)
        })
      })
    })
  })

  describe('rename existing file', function () {
    it('rename existing file', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const srcFilePath = `${testFolder}/中文.txt`
      const desFilePath = `${testFolder}/中文123.txt`
      const destinationWebDavPath = `remote.php/dav/files/${username}/${testFolder}/${encodeURI('中文123.txt')}`
      provider
        .given('the user is recreated', {
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file exists', {
          fileName: srcFilePath,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('provider base url is returned')
      await moveFileInteraction(
        provider,
        'different name',
        {
          ...validAuthHeaders,
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
        return oc.files.move(`files/${config.testUser}/${srcFilePath}`, `files/${config.testUser}/${desFilePath}`).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })
  })

  describe('copy existent file', function () {
    it('checking method : copy existent file into same folder, different name', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const srcFilePath = `${testFolder}/中文.txt`
      const desFilePath = `${testFolder}/中文123.txt`
      const destinationWebDavPath = `remote.php/dav/files/${username}/${testFolder}/${encodeURI('中文123.txt')}`
      await provider
        .given('the user is recreated', {
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file exists', {
          fileName: srcFilePath,
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('provider base url is returned')
        .uponReceiving(`as '${username}', a COPY request to copy existent file into same folder, different name`)
        .withRequest({
          method: 'COPY',
          path: webdavPath(srcFilePath, username),
          headers: {
            ...validAuthHeaders,
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
        return oc.files.copy(`files/${config.testUser}/${srcFilePath}`, `files/${config.testUser}/${desFilePath}`).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('checking method : copy existent file into different folder', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await provider
      const srcFilePath = `${testFolder}/中文.txt`
      const desFilePath = `${testFolder}/subdir/中文123.txt`
      const destinationWebDavPath = `remote.php/dav/files/${username}/${testFolder}/subdir/${encodeURI('中文123.txt')}`
      await provider
        .given('the user is recreated', {
          username: config.testUser,
          password: config.testUserPassword
        })
        .given('file exists', {
          fileName: srcFilePath,
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
          path: webdavPath(srcFilePath, username),
          headers: {
            ...validAuthHeaders,
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
        return oc.files.copy(`files/${config.testUser}/${srcFilePath}`, `files/${config.testUser}/${desFilePath}`).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })
  })

  describe('unfavorite a file', function () {
    // [oCIS] Favoriting files/folders not implemented
    // https://github.com/owncloud/ocis/issues/1228
    it('checking method: unfavorite', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      const file = `${testFolder}/${testFile}`
      await favoriteFileInteraction(provider, false, file)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.favorite(`files/${config.testUser}/${file}`, false)
          .then(status => {
            expect(status).toEqual(true)
          }).catch(error => {
            fail(error)
          })
      })
    })
  })

  describe('favorite, search file', function () {
    const fileId = 123456789
    const tagId = 6789
    const file = `${testFolder}/${testFile}`
    const newTagName = 'testSystemTag12345'

    // [oCIS] Favoriting files/folders not implemented
    // https://github.com/owncloud/ocis/issues/1228
    it('checking method: favorite', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await favoriteFileInteraction(provider, true, file)

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.favorite(`files/${config.testUser}/${file}`)
          .then(status => {
            expect(status).toEqual(true)
          }).catch(error => {
            fail(error)
          })
      })
    })

    // [oCIS] Favoriting files/folders not implemented
    // https://github.com/owncloud/ocis/issues/1228
    it('checking method: favorite filter', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, file)
      await givenFileIsMarkedFavorite(provider, config.testUser, config.testUserPassword, file)
      await provider
        .uponReceiving(`as '${username}', a REPORT request to get favorite file`)
        .withRequest({
          method: 'REPORT',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/files\\/' + config.testUser + '\\/$',
            '/remote.php/dav/files/' + config.testUser + '/'
          ),
          headers: {
            ...validAuthHeaders,
            ...xmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'oc:filter-files').build(ocFilterFiles => {
            ocFilterFiles.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            ocFilterFiles.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:favorite', '', '')
            }).appendElement('oc:filter-rules', '', ocFilterRules => {
              ocFilterRules.appendElement('oc:favorite', '', MatchersV3.equal('1'))
            })
          })
        })
        .willRespondWith({
          status: 207,
          headers: xmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '',
                MatchersV3.regex(
                  `.*\\/remote\\.php\\/dav\\/files\\/${config.testUser}\\/${file}`,
                  `/remote.php/dav/files/${config.testUser}/${file}`)
              )
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp.appendElement('oc:favorite', '', MatchersV3.equal('1'))
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            })
          })
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.getFavoriteFiles(['{http://owncloud.org/ns}favorite'])
          .then(files => {
            expect(files.length).toEqual(1)
            expect(files[0].getProperty('{http://owncloud.org/ns}favorite')).toEqual('1')
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })

    // https://github.com/owncloud/ocis/issues/1330
    // REPORT method not implemented in ocis
    it('checking method getFavoriteFiles when there are no favorite files', async () => {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, file)
      await provider
        .uponReceiving(`as '${username}', a REPORT request to get favorite file when there are no favorites`)
        .withRequest({
          method: 'REPORT',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/files\\/' + config.testUser + '\\/$',
            '/remote.php/dav/files/' + config.testUser + '/'
          ),
          headers: {
            ...validAuthHeaders,
            ...xmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'oc:filter-files').build(ocFilterFiles => {
            ocFilterFiles.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            ocFilterFiles.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:favorite', '', '')
            }).appendElement('oc:filter-rules', '', ocFilterRules => {
              ocFilterRules.appendElement('oc:favorite', '', MatchersV3.equal('1'))
            })
          })
        })
        .willRespondWith({
          status: 207,
          headers: xmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
          })
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.getFavoriteFiles(['{http://owncloud.org/ns}favorite'])
          .then(files => {
            expect(files.length).toEqual(0)
          }).catch(error => {
            fail(error)
          })
      })
    })

    // https://github.com/owncloud/ocis/issues/1330
    // REPORT method not implemented in ocis
    it('searches in the instance', async function () {
      const davProperties = [
        '{http://owncloud.org/ns}favorite',
        '{DAV:}getcontentlength',
        '{http://owncloud.org/ns}size',
        '{DAV:}getlastmodified',
        '{DAV:}resourcetype'
      ]

      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )

      const filename = 'abc.txt'
      const filePath = testFolder + '/' + filename
      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, filePath)
      await provider
        .uponReceiving(`as '${username}', a REPORT request to search in the instance`)
        .withRequest({
          method: 'REPORT',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/files\\/' + config.testUser + '\\/$',
            '/remote.php/dav/files/' + config.testUser + '/'
          ),
          headers: {
            ...validAuthHeaders,
            ...xmlResponseHeaders
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
              ocSearch.appendElement('oc:pattern', '', MatchersV3.equal('abc'))
                .appendElement('oc:limit', '', MatchersV3.equal(30))
            })
          })
        })
        .willRespondWith({
          status: 207,
          headers: xmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '',
                MatchersV3.regex(
                  `.*\\/remote\\.php\\/dav\\/files\\/${config.testUser}\\/${filePath}`,
                  `/remote.php/dav/files/${config.testUser}/${filePath}`
                )
              )
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp
                      .appendElement('oc:favorite', '', MatchersV3.equal('0'))
                      .appendElement('d:getcontentlength', '', MatchersV3.equal('6'))
                      .appendElement('oc:size', '', MatchersV3.equal('6'))
                      .appendElement('d:getlastmodified', '',
                        MatchersV3.date('EEE, d MMM yyyy HH:mm:ss z', 'Wed, 21 Oct 2020 11:20:54 GMT')
                      )
                      .appendElement('d:resourcetype', '', '')
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            })
          })
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.search('abc', 30, davProperties).then(files => {
          expect(typeof (files)).toBe('object')
          expect(files.length).toEqual(1)
          expect(files[0].getName()).toEqual(filename)
          expect(files[0].getPath()).toEqual(`/files/${config.testUser}/${testFolder}/`)
          expect(files[0].getSize()).toEqual(6)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    // [oCIS] cannot create system tags
    // https://github.com/owncloud/ocis/issues/1947
    it('checking method: filter by tag', async function () {
      const getFileInfoBy = data => {
        return {
          status: 207,
          headers: xmlResponseHeaders,
          body: new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
            dMultistatus.setAttributes({
              'xmlns:d': 'DAV:',
              'xmlns:s': 'http://sabredav.org/ns',
              'xmlns:oc': 'http://owncloud.org/ns'
            })
            const davPath = data === fileId ? 'webdav' : 'dav/files/' + config.testUser
            const davPathRegex = davPath.replace(/\//g, '\\\\/')
            dMultistatus.appendElement('d:response', '', dResponse => {
              dResponse.appendElement('d:href', '', MatchersV3.regex(
                `.*\\/remote\\.php\\/${davPathRegex}\\/${testFolder}\\/${testFile}`,
                `/remote.php/${davPath}/${testFolder}/${testFile}`
              ))
                .appendElement('d:propstat', '', dPropstat => {
                  dPropstat.appendElement('d:prop', '', dProp => {
                    dProp
                      .appendElement('oc:fileid', '', MatchersV3.equal(fileId))
                  })
                    .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
                })
            })
          })
        }
      }
      const provider = createProvider(true, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )

      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, testFile)
      await givenSystemTagExists(provider, config.testUser, config.testUserPassword, newTagName)
      await givenTagIsAssignedToFile(provider, config.testUser, config.testUserPassword, testFile, newTagName)
      await provider
        .uponReceiving(`as '${username}', a REPORT request to get files by tag`)
        .withRequest({
          method: 'REPORT',
          path: MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/files\\/' + config.testUser + '\\/$',
            '/remote.php/dav/files/' + config.testUser + '/'
          ),
          headers: {
            ...validAuthHeaders,
            ...xmlResponseHeaders
          },
          body: new XmlBuilder('1.0', '', 'oc:filter-files').build(ocFilterFiles => {
            ocFilterFiles.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
            ocFilterFiles.appendElement('d:prop', '', dProp => {
              dProp.appendElement('oc:fileid', '', '')
            }).appendElement('oc:filter-rules', '', ocFilterRules => {
              ocFilterRules.appendElement('oc:systemtag', '',
                MatchersV3.fromProviderState('${tagId}', tagId)) /* eslint-disable-line no-template-curly-in-string */
            })
          })
        })
        .willRespondWith(getFileInfoBy('tag'))

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.files.getFilesByTags([tagId], ['{http://owncloud.org/ns}fileid'])
          .then(files => {
            expect(files.length).toEqual(1)
            expect(files[0].getName()).toEqual(testFile)
          }).catch(error => {
            expect(error).toBe(null)
          })
      })
    })

    // [oCIS] cannot create system tags
    // https://github.com/owncloud/ocis/issues/1947
    it('checking method: create tag', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )

      const tagToCreate = newTagName + Date.now()
      await givenUserExists(provider, config.testUser, config.testUserPassword)
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
          body: { canAssign: true, name: tagToCreate, userAssignable: true, userEditable: true, userVisible: true }
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Location': MatchersV3.fromProviderState(
              '/remote.php/dav/systemtags/${tagId}', /* eslint-disable-line no-template-curly-in-string */
              `/remote.php/dav/systemtags/${tagId}`
            )
          }
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.systemTags.createTag({ name: tagToCreate })
          .catch(error => {
            expect(error).toBe(null)
          })
      })
    })

    // [oCIS] cannot create system tags
    // https://github.com/owncloud/ocis/issues/1947
    it('checking method: tag file', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider, config.testUser, config.testUserPassword)
      await getCurrentUserInformationInteraction(
        provider, config.testUser, config.testUserPassword
      )

      await givenUserExists(provider, config.testUser, config.testUserPassword)
      await givenFileExists(provider, config.testUser, config.testUserPassword, testFile)
      await givenSystemTagExists(provider, config.testUser, config.testUserPassword, newTagName)
      await provider
        .uponReceiving(`as '${username}', a PUT request to tag file`)
        .withRequest({
          method: 'PUT',
          path: MatchersV3.fromProviderState(
            '/remote.php/dav/systemtags-relations/files/${fileId}/${tagId}', /* eslint-disable-line no-template-curly-in-string */
            `/remote.php/dav/systemtags-relations/files/${fileId}/${tagId}`
          ),
          headers: validAuthHeaders
        })
        .willRespondWith({
          status: 201
        })

      return provider.executeTest(async () => {
        const oc = createOwncloud(config.testUser, config.testUserPassword)
        await oc.login()
        return oc.systemTags.tagFile(fileId, tagId)
          .catch(error => {
            expect(error).toBe(null)
          })
      })
    })
  })
})
