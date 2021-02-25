// TODO: Unskip the tests after the issue is fixed
// https://github.com/owncloud/owncloud-sdk/issues/705
import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('oc.publicFiles', function () {
  const config = require('./config/config.json')
  const using = require('jasmine-data-provider')
  const { testUser, testUserPassword, testFolder, testFile } = config

  const {
    validAdminAuthHeaders,
    origin,
    xmlResponseAndAccessControlCombinedHeader,
    htmlResponseAndAccessControlCombinedHeader,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createOwncloud,
    createProvider,
    textPlainResponseHeaders,
    applicationXmlResponseHeaders,
    ocsMeta
  } = require('./pactHelper.js')

  const publicLinkShareTokenPath = MatchersV3.regex(
    '.*\\/remote\\.php\\/dav\\/public-files\\/' + config.shareTokenOfPublicLinkFolder,
    '/remote.php/dav/public-files/' + config.shareTokenOfPublicLinkFolder + '/'
  )

  const moveResourceResponse = {
    status: 201,
    headers: htmlResponseAndAccessControlCombinedHeader
  }

  const publicShareInteraction = (provider, description, method, responseBody) => {
    return provider
      .uponReceiving(`as '${testUser}', a ${method} request to ${description}`)
      .withRequest({
        method: method,
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        ),
        headers: validAdminAuthHeaders
      }).willRespondWith({
        status: 200,
        headers: xmlResponseAndAccessControlCombinedHeader,
        body: responseBody
      })
  }

  const folderInPublicShareInteraction = (provider, description, method, statusCode) => {
    return provider
      .given('the user is recreated', { username: testUser, password: testUserPassword })
      .given('folder exists', {
        username: testUser,
        password: testUserPassword,
        folderName: testFolder
      })
      .given('resource is shared', {
        username: testUser,
        password: testUserPassword,
        resource: testFolder,
        shareType: 3,
        permissions: 15
      })
      .uponReceiving(`as '${testUser}', a ${method} request to ${description}`)
      .withRequest({
        method: method,
        path: MatchersV3.fromProviderState(
          '/remote.php/dav/public-files/${token}/foo', /* eslint-disable-line no-template-curly-in-string */
          `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/foo`
        )
      })
      .willRespondWith({
        status: statusCode,
        headers: htmlResponseAndAccessControlCombinedHeader
      })
  }

  const publicShareContentInteraction = (provider, description, method, statusCode, requestBody = undefined, responseBody = undefined) => {
    return provider
      .given('the user is recreated', { username: testUser, password: testUserPassword })
      .given('folder exists', {
        username: testUser,
        password: testUserPassword,
        folderName: testFolder
      })
      .given('resource is shared', {
        username: testUser,
        password: testUserPassword,
        resource: testFolder,
        shareType: 3,
        permissions: 15
      })
      .given('file exists in last shared public share', { fileName: testFile })
      .uponReceiving(`as '${testUser}', a ${method} request to ${description}`)
      .withRequest({
        method: method,
        path: MatchersV3.fromProviderState(
          '/remote.php/dav/public-files/${token}/' + testFile, /* eslint-disable-line no-template-curly-in-string */
          `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/${testFile}`
        ),
        headers: {
          ...textPlainResponseHeaders
        },
        body: requestBody
      })
      .willRespondWith({
        status: statusCode,
        headers: htmlResponseAndAccessControlCombinedHeader,
        body: responseBody
      })
  }

  describe('when creating file urls', function () {
    using({
      'token only': {
        token: 'abcdef',
        path: null,
        expected: 'remote.php/dav/public-files/abcdef'
      },
      'token and path': {
        token: 'abcdef',
        path: 'foo/bar.txt',
        expected: 'remote.php/dav/public-files/abcdef/foo/bar.txt'
      },
      'token and path starting with a forward slash': {
        token: 'abcdef',
        path: '/foo/bar.txt',
        expected: 'remote.php/dav/public-files/abcdef/foo/bar.txt'
      }
    }, function (data, description) {
      it('shall work with ' + description, function () {
        const oc = createOwncloud()
        expect(oc.publicFiles.getFileUrl(data.token, data.path))
          .toBe(config.owncloudURL + data.expected)
      })
    })
  })

  describe.skip('when listing a shared folder', function () {
    using({
      'without password': {
        shareParams: {},
        passwordWhenListing: null,
        shallGrantAccess: true
      },
      'with password': {
        shareParams: {
          password: 'password'
        },
        passwordWhenListing: 'password',
        shallGrantAccess: true
      },
      'with password but invalid when accessing': {
        shareParams: {
          password: 'password'
        },
        passwordWhenListing: 'invalid',
        shallGrantAccess: false
      },
      'with password but no password when accessing': {
        shareParams: {
          password: 'password'
        },
        passwordWhenListing: null,
        shallGrantAccess: false
      }
    }, function (data, description) {
      describe(description, function () {
        // TESTING CONFIGS
        const testContent = config.testContent

        // CREATED SHARES
        let testFolderShare = null

        it('should list the folder contents', async function () {
          const provider = createProvider()
          await getCapabilitiesInteraction(provider)
          await getCurrentUserInformationInteraction(provider)
          await publicShareInteraction(
            provider,
            'create a public link share',
            'POST',
            new XmlBuilder('1.0', '', 'ocs').build(ocs => {
              ocs.appendElement('meta', '', (meta) => {
                ocsMeta(meta, 'ok', '100')
              }).appendElement('data', '', (data) => {
                data.appendElement('token', '', config.shareTokenOfPublicLinkFolder)
              })
            })
          )
          if (data.shallGrantAccess) {
            await provider
              .uponReceiving(`as '${testUser}', a PROPFIND request to list contents of a public link folder`)
              .withRequest({
                method: 'PROPFIND',
                path: publicLinkShareTokenPath
              })
              .willRespondWith({
                status: 207,
                headers: xmlResponseAndAccessControlCombinedHeader,
                body: propfindBody('1')
              })
          } else {
            await provider
              .uponReceiving(`as '${testUser}', a PROPFIND request to list contents of a password protected public link folder using the wrong password`)
              .withRequest({
                method: 'PROPFIND',
                path: publicLinkShareTokenPath,
                headers: {
                  Origin: origin
                }
              })
              .willRespondWith({
                status: 401,
                headers: xmlResponseAndAccessControlCombinedHeader,
                body: new XmlBuilder('1.0', '', 'd:error').build(dError => {
                  dError.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:s': 'http://sabredav.org/ns' })
                  dError.appendElement('s:exception', {}, 'Sabre\\DAV\\Exception\\webdavExceptionResponseBody')
                })
              })
          }
          return provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()

            await oc.shares.shareFileWithLink(config.testFolder, data.shareParams).then(share => {
              expect(typeof (share)).toBe('object')
              testFolderShare = share
            }).catch(error => {
              fail(error)
            })

            await oc.publicFiles.list(testFolderShare.getToken(), data.passwordWhenListing).then(files => {
              if (data.shallGrantAccess) {
                // test length
                expect(files.length).toBe(4)
                // test root folder
                expect(files[0].getName()).toBe(testFolderShare.getToken())
                expect(files[0].getPath()).toBe('/')
                expect(files[0].getProperty(oc.publicFiles.PUBLIC_LINK_ITEM_TYPE)).toBe('folder')
                expect(files[0].getProperty(oc.publicFiles.PUBLIC_LINK_SHARE_OWNER)).toBe(config.adminUsername)
                expect(files[0].getProperty(oc.publicFiles.PUBLIC_LINK_PERMISSION)).toBe('1')

                // test folder elements
                expect(files[1].getName()).toBe(config.testFiles[0])
                expect(files[1].getPath()).toBe('/' + testFolderShare.getToken() + '/')

                expect(files[2].getName()).toBe(config.testFiles[1])
                expect(files[2].getPath()).toBe('/' + testFolderShare.getToken() + '/')

                expect(files[3].getName()).toBe(config.testFiles[2])
                expect(files[3].getPath()).toBe('/' + testFolderShare.getToken() + '/')
              } else {
                fail(files)
              }
            }).catch(error => {
              if (data.shallGrantAccess) {
                fail(error)
              } else {
                expect(error.statusCode).toBe(401)
              }
            })
          })
        })

        it('should download files from a public shared folder', async function () {
          const provider = createProvider()
          if (data.shallGrantAccess) {
            await provider
              .uponReceiving(`as '${testUser}', a GET request to download files from a public shared folder`)
              .withRequest({
                method: 'GET',
                path: publicLinkShareTokenPath
              })
              .willRespondWith({
                status: 200,
                headers: {
                  'Content-Type': 'text/plain;charset=UTF-8',
                  'Access-Control-Allow-Origin': origin
                },
                body: testContent
              })
          } else {
            await provider
              .uponReceiving(`as '${testUser}', a GET request to download files from a public shared folder using wrong password`)
              .withRequest({
                method: 'GET',
                path: publicLinkShareTokenPath
              })
              .willRespondWith({
                status: 401,
                headers: {
                  // 'Content-Type': 'text/plain;charset=UTF-8',
                  'Access-Control-Allow-Origin': origin
                },
                body: new XmlBuilder('1.0', '', 'd:error').build(dError => {
                  dError.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:s': 'http://sabredav.org/ns' })
                  dError.appendElement('s:exception', {}, 'Sabre\\DAV\\Exception\\NotAuthenticated')
                    .appendElement('s:message', '', 'Username or password was incorrect, No public access to this resource., Username or password was incorrect, Username or password was incorrect')
                })
              })
          }
          await getCapabilitiesInteraction(provider)
          await getCurrentUserInformationInteraction(provider)

          return provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()
            await oc.shares.shareFileWithLink(config.testFolder, data.shareParams).then(share => {
              expect(typeof (share)).toBe('object')
              testFolderShare = share
            }).catch(error => {
              fail(error)
            })
            await oc.publicFiles.download(testFolderShare.getToken(), config.testFiles[2], data.passwordWhenListing).then(resp => {
              if (data.shallGrantAccess) {
                if (resp.ok) {
                  return resp.text().then(text => {
                    expect(text).toEqual(testContent)
                  })
                } else {
                  fail(resp.statusText)
                }
              } else {
                expect(resp.status).toBe(401)
              }
            }).catch(error => {
              if (data.shallGrantAccess) {
                fail(error)
              } else {
                expect(error.statusCode).toBe(401)
              }
            })
          })
        })
      })
    })
  })
  describe('when working with files and folder a shared folder', function () {
    using({
      'without password': {
        description: 'without password',
        shareParams: {
          permissions: 15
        }
      },
      'with password': {
        description: 'with password',
        shareParams: {
          password: 'password',
          permissions: 15
        }
      }
    }, function (data, description) {
      describe(description, function () {
        it('should create a folder', async function () {
          const provider = createProvider()
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
          await folderInPublicShareInteraction(
            provider,
            'create a folder in public share' + ' ' + data.description,
            'MKCOL',
            201
          )

          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()

            return oc.publicFiles.createFolder(config.shareTokenOfPublicLinkFolder, 'foo', data.shareParams.password).then((response) => {
              expect(response).toBe(true)
            }).catch(error => {
              fail(error)
            })
          })
        })

        it.skip('should create a file', async function () {
          const provider = createProvider()
          await getCapabilitiesInteraction(provider)
          await getCurrentUserInformationInteraction(provider)
          await publicShareContentInteraction(
            provider,
            'update content of public share' + ' ' + data.description,
            'PUT',
            204,
            'lorem'
          )

          await publicShareContentInteraction(
            provider,
            'get content of file in public share' + ' ' + data.description,
            'GET',
            200,
            undefined,
            config.testContent
          )

          return provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()

            try {
              const testContent = '123456'
              const newFile = 'lorem.txt'
              let progressCalled = false
              const options = {
                onProgress: () => {
                  progressCalled = true
                }
              }
              const status = await oc.publicFiles.putFileContents(
                config.shareTokenOfPublicLinkFolder,
                newFile,
                data.shareParams.password,
                testContent,
                options
              )
              expect(typeof status).toBe('object')
              expect(progressCalled).toEqual(true)
              const resp = await oc.publicFiles.download(config.shareTokenOfPublicLinkFolder, newFile, data.shareParams.password)
              const content = await resp.text()
              expect(content).toEqual(testContent)
            } catch (error) {
              fail(error)
            }
          })
        })

        it('should update a file', async function () {
          const provider = createProvider()
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
          await publicShareContentInteraction(
            provider,
            'update content of public share' + ' ' + data.description + ' and content lorem',
            'PUT',
            204,
            'lorem'
          )
          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()
            try {
              const options = {
                previousEntityTag: config.testFileEtag
              }
              const response = await oc.publicFiles.putFileContents(config.shareTokenOfPublicLinkFolder, testFile, data.shareParams.password, 'lorem', options)
              expect(typeof response).toBe('object')
            } catch (error) {
              fail(error)
            }
          })
        })

        it('should move a file', async function () {
          const source = config.shareTokenOfPublicLinkFolder + '/' + testFile
          const target = config.shareTokenOfPublicLinkFolder + '/lorem123456.txt'

          const provider = createProvider()
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
          await provider
            .given('provider base url is returned')
            .given('the user is recreated', { username: testUser, password: testUserPassword })
            .given('folder exists', { username: testUser, password: testUserPassword, folderName: testFolder })
            .given('resource is shared', { username: testUser, password: testUserPassword, resource: testFolder, shareType: 3, permissions: 15 })
            .given('file exists in last shared public share', { fileName: testFile })
            .uponReceiving(`as '${testUser}', a MOVE request to move a file in public share ${data.description}`)
            .withRequest({
              method: 'MOVE',
              path: MatchersV3.fromProviderState(
                '/remote.php/dav/public-files/${token}/' + testFile, /* eslint-disable-line no-template-curly-in-string */
                `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/${testFile}`
              ),
              headers: {
                Destination: MatchersV3.fromProviderState(
                  '\${providerBaseURL}/remote.php/dav/public-files/\${token}/lorem123456.txt', /* eslint-disable-line */
                  `${config.owncloudURL}remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/lorem123456.txt`)
              }
            })
            .willRespondWith(moveResourceResponse)

          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()
            return oc.publicFiles.move(source, target, data.shareParams.password)
              .catch(error => {
                fail(error)
              })
          })
        })

        it('should move a file to subfolder', async function () {
          const source = config.shareTokenOfPublicLinkFolder + '/' + testFile
          const target = config.shareTokenOfPublicLinkFolder + '/foo/lorem.txt'

          const provider = createProvider()
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
          await provider
            .given('provider base url is returned')
            .given('the user is recreated', { username: testUser, password: testUserPassword })
            .given('folder exists', { username: testUser, password: testUserPassword, folderName: testFolder })
            .given('resource is shared', { username: testUser, password: testUserPassword, resource: testFolder, shareType: 3, permissions: 15 })
            .given('folder exists in last shared public share', { folderName: 'foo' })
            .given('file exists in last shared public share', { fileName: testFile })
            .uponReceiving(`as '${testUser}', a MOVE request to move a file to subfolder in public share ${data.description}`)
            .withRequest({
              method: 'MOVE',
              path: MatchersV3.fromProviderState(
                '/remote.php/dav/public-files/${token}/' + testFile, /* eslint-disable-line no-template-curly-in-string */
                `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/${testFile}`
              ),
              headers: {
                Destination: MatchersV3.fromProviderState(
                  '\${providerBaseURL}/remote.php/dav/public-files/\${token}/foo/lorem.txt', /* eslint-disable-line */
                  `${config.owncloudURL}remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/foo/lorem.txt`)
              }
            })
            .willRespondWith(moveResourceResponse)

          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()
            return oc.publicFiles.move(source, target, data.shareParams.password).catch(error => {
              fail(error)
            })
          })
        })

        it('should move a folder', async function () {
          const provider = createProvider()
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
          await provider
            .given('provider base url is returned')
            .given('the user is recreated', { username: testUser, password: testUserPassword })
            .given('folder exists', { username: testUser, password: testUserPassword, folderName: testFolder })
            .given('resource is shared', { username: testUser, password: testUserPassword, resource: testFolder, shareType: 3, permissions: 15 })
            .given('folder exists in last shared public share', { folderName: 'foo' })
            .uponReceiving(`as '${testUser}', a MOVE request to move a folder to different name in public share ${data.description}`)
            .withRequest({
              method: 'MOVE',
              path: MatchersV3.fromProviderState(
                '/remote.php/dav/public-files/${token}/foo', /* eslint-disable-line no-template-curly-in-string */
                `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/foo`
              ),
              headers: {
                Destination: MatchersV3.fromProviderState(
                  '\${providerBaseURL}/remote.php/dav/public-files/\${token}/bar', /* eslint-disable-line */
                  `${config.owncloudURL}remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/bar`
                )
              }
            }).willRespondWith(moveResourceResponse)
          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()
            const source = config.shareTokenOfPublicLinkFolder + '/' + 'foo'
            const target = config.shareTokenOfPublicLinkFolder + '/' + 'bar'

            return oc.publicFiles.move(source, target, data.shareParams.password).then((response) => {
              expect(response).toBe(true)
            }).catch(error => {
              fail(error)
            })
          })
        })

        it.skip('should get fileInfo of shared folder', async function () {
          const provider = createProvider()
          await getCapabilitiesInteraction(provider)
          await getCurrentUserInformationInteraction(provider)
          await provider
            .uponReceiving(`as '${testUser}', a PROPFIND request to get file info of public share ${data.description}`)
            .withRequest({
              method: 'PROPFIND',
              path: publicLinkShareTokenPath,
              headers: {
                ...applicationXmlResponseHeaders
              },
              body: new XmlBuilder('1.0', '', 'd:propfind').build(dPropfind => {
                dPropfind.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
                dPropfind.appendElement('d:prop', '', dProp => {
                  dProp.appendElement('oc:public-link-item-type', '', '')
                  dProp.appendElement('oc:public-link-permission', '', '')
                  dProp.appendElement('oc:public-link-expiration', '', '')
                  dProp.appendElement('oc:public-link-share-datetime', '', '')
                  dProp.appendElement('oc:public-link-share-owner', '', '')
                  dProp.appendElement('d:getcontenttype', '', '')
                })
              })
            })
            .willRespondWith({
              status: 207,
              headers: xmlResponseAndAccessControlCombinedHeader,
              body: propfindBody('15')
            })

          return provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()
            const sharedFolder = config.shareTokenOfPublicLinkFolder
            const folder = await oc.publicFiles.getFileInfo(
              sharedFolder,
              data.shareParams.password
            )
            // Return error message in case the name does not exist
            if (!folder.name) {
              return fail(folder)
            }
            // We need to remove slash which is first char in fileInfo.name
            const folderName = folder.name.slice(1)
            expect(folderName).toBe(sharedFolder)
          })
        })
      })
    })
  })

  function buildPropfindFileList (node) {
    for (let fileNum = 0; fileNum < config.testFiles.length; fileNum++) {
      node.appendElement('d:response', '', dResponse => {
        dResponse.appendElement('d:href', '', '/remote.php/dav/public-files/' + config.shareTokenOfPublicLinkFolder + '/' +
          encodeURIComponent(config.testFiles[fileNum]))
          .appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('d:getcontenttype', '', 'text/plain')
            })
              .appendElement('d:status', '', 'HTTP/1.1 200 OK')
          }).appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('oc:public-link-item-type', '', '')
                .appendElement('oc:public-link-permission', '', '')
                .appendElement('oc:public-link-expiration', '', '')
                .appendElement('oc:public-link-share-datetime', '', '')
                .appendElement('oc:public-link-share-owenr', '', '')
            })
              .appendElement('d:status', '', 'HTTP/1.1 404 Not Found')
          })
      })
    }
  }

  function propfindBody (permission) {
    return new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
      dMultistatus.appendElement('d:response', '', dResponse => {
        dResponse.appendElement('d:href', '', '/remote.php/dav/public-files/' + config.shareTokenOfPublicLinkFolder)
          .appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('oc:public-link-item-type', '', 'folder')
                .appendElement('oc:public-link-permission', '', permission)
                .appendElement('oc:public-link-share-owner', '', config.adminUsername)
            })
              .appendElement('d:status', '', 'HTTP/1.1 200 OK')
          })
        if (permission === '1') {
          buildPropfindFileList(dResponse)
        }
      })
    })
  }
})
