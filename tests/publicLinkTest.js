// TODO: Review all matchers in xml once the issue is fixed
// https://github.com/pact-foundation/pact-js/issues/632

import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('oc.publicFiles', function () {
  const {
    shareTokenOfPublicLinkFolder,
    testFolder,
    testFile,
    testFiles,
    testContent,
    testFileEtag
  } = require('./config/config.json')
  const {
    testUser1: { username: testUser, password: testUserPassword }
  } = require('./config/users.json')
  const using = require('jasmine-data-provider')

  const {
    xmlResponseHeaders,
    htmlResponseAndAccessControlCombinedHeader,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createOwncloud,
    createProvider,
    textPlainResponseHeaders,
    getMockServerBaseUrl,
    getPublicLinkAuthHeader
  } = require('./helpers/pactHelper.js')

  const mockServerBaseUrl = getMockServerBaseUrl()

  const {
    givenUserExists,
    givenPublicShareExists,
    givenFolderExists,
    givenFileExists
  } = require('./helpers/providerStateHelper')

  const publicLinkShareTokenPath = MatchersV3.fromProviderState(
    '/remote.php/dav/public-files/${token}', /* eslint-disable-line no-template-curly-in-string */
    '/remote.php/dav/public-files/' + shareTokenOfPublicLinkFolder + '/'
  )

  const moveResourceResponse = {
    status: 201,
    headers: {
      ...htmlResponseAndAccessControlCombinedHeader
    }
  }

  const folderInPublicShareInteraction = async (provider, description, method, statusCode, password = null) => {
    let headers = {}
    if (password) {
      headers = getPublicLinkAuthHeader(password)
    }

    await givenUserExists(provider, testUser)
    await givenFolderExists(provider, testUser, testFolder)
    return provider
      .given('resource is shared', {
        username: testUser,
        userPassword: testUserPassword,
        path: testFolder,
        shareType: 3,
        permissions: 15,
        password
      })
      .uponReceiving(`as '${testUser}', a ${method} request to ${description}`)
      .withRequest({
        method: method,
        path: MatchersV3.fromProviderState(
          '/remote.php/dav/public-files/${token}/foo', /* eslint-disable-line no-template-curly-in-string */
          `/remote.php/dav/public-files/${shareTokenOfPublicLinkFolder}/foo`
        ),
        headers
      })
      .willRespondWith({
        status: statusCode,
        headers: htmlResponseAndAccessControlCombinedHeader
      })
  }

  const publicShareContentInteraction = async (provider, description, method, statusCode, requestBody = undefined, responseBody = undefined, password) => {
    let headers = textPlainResponseHeaders
    let responseHeaders = {}
    if (method === 'PUT') {
      headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
      responseHeaders = {
        ETag: MatchersV3.string('f356def9fc42fd4cbddf293eba3efa86'),
        'OC-ETag': MatchersV3.string('f356def9fc42fd4cbddf293eba3efa86')
      }
    } else if (method === 'GET') {
      headers = {}
      responseHeaders = textPlainResponseHeaders
    }
    if (password) {
      headers = {
        ...headers,
        ...getPublicLinkAuthHeader(password)
      }
    }

    await givenUserExists(provider, testUser)
    await givenFolderExists(provider, testUser, testFolder)
    await provider
      .given('resource is shared', {
        username: testUser,
        userPassword: testUserPassword,
        path: testFolder,
        shareType: 3,
        permissions: 15,
        password
      })

    if (method === 'GET' || statusCode === 204) {
      await provider.given('file exists in last shared public share', { fileName: testFile, content: responseBody, password })
    }

    return provider
      .uponReceiving(`as '${testUser}', a ${method} request to ${description}`)
      .withRequest({
        method: method,
        path: MatchersV3.fromProviderState(
          '/remote.php/dav/public-files/${token}/' + testFile, /* eslint-disable-line no-template-curly-in-string */
          `/remote.php/dav/public-files/${shareTokenOfPublicLinkFolder}/${testFile}`
        ),
        headers,
        body: requestBody
      })
      .willRespondWith({
        status: statusCode,
        headers: responseHeaders,
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
        const oc = createOwncloud(testUser, testUserPassword)
        expect(oc.publicFiles.getFileUrl(data.token, data.path))
          .toBe(mockServerBaseUrl + data.expected)
      })
    })
  })

  describe('when listing a shared folder', function () {
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
        it('should list the folder contents', async function () {
          let provider
          if (data.shallGrantAccess) {
            provider = createProvider(true, true)
          } else {
            provider = createProvider(false, true)
          }
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)

          const listContentsOfPublicLinkInteraction = async (provider, options) => {
            const { passwordWhenListing, shallGrantAccess } = options
            let description = `as ${testUser}, a PROPFIND request to list contents of public link folder`
            if (passwordWhenListing) {
              if (shallGrantAccess) {
                description += ' with valid password "' + passwordWhenListing + '"'
              } else {
                description += ' with invalid password "' + passwordWhenListing + '"'
              }
            } else {
              if (shallGrantAccess) {
                description += ' where password is not set'
              } else {
                description += ' wihout password where password is set'
              }
            }
            let headers, body
            if (passwordWhenListing) {
              headers = getPublicLinkAuthHeader(data.passwordWhenListing)
            }
            if (shallGrantAccess) {
              body = propfindBody('1')
            } else {
              body = new XmlBuilder('1.0', '', 'd:error').build(dError => {
                dError.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:s': 'http://sabredav.org/ns' })
                dError.appendElement('s:exception', {}, MatchersV3.equal('Sabre\\DAV\\Exception\\NotAuthenticated'))
              })
            }
            const status = shallGrantAccess ? 207 : 401

            await givenUserExists(provider, testUser, testUserPassword)
            for (let fileNum = 0; fileNum < testFiles.length; fileNum++) {
              await givenFileExists(provider, testUser, testFolder + '/' + testFiles[fileNum])
            }
            if (data.shareParams.password) {
              await givenPublicShareExists(provider, testUser, testUserPassword, testFolder, { password: data.shareParams.password })
            } else {
              await givenPublicShareExists(provider, testUser, testUserPassword, testFolder)
            }
            return provider
              .uponReceiving(description)
              .withRequest({
                method: 'PROPFIND',
                path: publicLinkShareTokenPath,
                headers: {
                  ...headers,
                  ...xmlResponseHeaders
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
              // [oCIS] responses are not identical with oC10
              // https://github.com/owncloud/ocis/issues/1944
              // [oCIS] unauthorized request has empty response body
              // https://github.com/owncloud/ocis/issues/1945
              .willRespondWith({
                status,
                headers: xmlResponseHeaders,
                body
              })
          }

          await listContentsOfPublicLinkInteraction(provider, data)
          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()

            return oc.publicFiles.list(shareTokenOfPublicLinkFolder, data.passwordWhenListing).then(files => {
              if (data.shallGrantAccess) {
                // test length
                expect(files.length).toBe(4)
                // test root folder
                expect(files[0].getName()).toBe(shareTokenOfPublicLinkFolder)
                expect(files[0].getPath()).toBe('/')
                expect(files[0].getProperty(oc.publicFiles.PUBLIC_LINK_ITEM_TYPE)).toBe('folder')
                expect(files[0].getProperty(oc.publicFiles.PUBLIC_LINK_SHARE_OWNER)).toBe(testUser)
                expect(files[0].getProperty(oc.publicFiles.PUBLIC_LINK_PERMISSION)).toBe('1')

                // test folder elements
                expect(files[1].getName()).toBe(testFiles[0])
                expect(files[1].getPath()).toBe('/' + shareTokenOfPublicLinkFolder + '/')

                expect(files[2].getName()).toBe(testFiles[1])
                expect(files[2].getPath()).toBe('/' + shareTokenOfPublicLinkFolder + '/')

                expect(files[3].getName()).toBe(testFiles[2])
                expect(files[3].getPath()).toBe('/' + shareTokenOfPublicLinkFolder + '/')
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
          const getFileFromPublicLinkInteraction = async (provider, options) => {
            const method = 'GET'
            const path = MatchersV3.fromProviderState(
              `/remote.php/dav/public-files/\${token}/${encodeURIComponent(testFiles[2])}`,
              '/remote.php/dav/public-files/' + shareTokenOfPublicLinkFolder + '/' + encodeURIComponent(testFiles[2])
            )
            const { shallGrantAccess, passwordWhenListing } = options

            let resStatusCode = 200
            let resBody = testContent
            let respHeaders = xmlResponseHeaders

            if (!shallGrantAccess) {
              // https://github.com/owncloud/core/issues/38530
              // Fix the error message once this issue is fixed
              let errorMessage = ''
              if (passwordWhenListing) {
                errorMessage = 'Username or password was incorrect, No public access to this resource., Username or password was incorrect, Username or password was incorrect'
              } else {
                errorMessage = 'No \'Authorization: Basic\' header found. Either the client didn\'t send one, or the server is misconfigured, No public access to this resource., No \'Authorization: Basic\' header found. Either the client didn\'t send one, or the server is misconfigured, No \'Authorization: Basic\' header found. Either the client didn\'t send one, or the server is misconfigured'
              }
              resStatusCode = 401
              resBody = new XmlBuilder('1.0', '', 'd:error').build(dError => {
                dError.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:s': 'http://sabredav.org/ns' })
                dError.appendElement('s:exception', {}, MatchersV3.equal('Sabre\\DAV\\Exception\\NotAuthenticated'))
                  .appendElement('s:message', '', MatchersV3.equal(errorMessage))
              })
            } else {
              respHeaders = textPlainResponseHeaders
            }

            let headers
            if (passwordWhenListing) {
              headers = getPublicLinkAuthHeader(data.passwordWhenListing)
            }
            let description = `as ${testUser}, a ${method} request to download files from a public shared folder`
            if (passwordWhenListing) {
              if (shallGrantAccess) {
                description += ' with valid password "' + passwordWhenListing + '"'
              } else {
                description += ' with invalid password "' + passwordWhenListing + '"'
              }
            } else {
              if (shallGrantAccess) {
                description += ' where password is not set'
              } else {
                description += ' where password is set but request without password'
              }
            }

            await givenUserExists(provider, testUser, testUserPassword)
            await givenFileExists(provider, testUser, testFolder + '/' + testFiles[2])
            if (data.shareParams.password) {
              await givenPublicShareExists(provider, testUser, testUserPassword, testFolder, { password: data.shareParams.password })
            } else {
              await givenPublicShareExists(provider, testUser, testUserPassword, testFolder)
            }
            return provider
              .uponReceiving(description)
              .withRequest({ method, path, headers })
              // [oCIS] unauthorized request has empty response body
              // https://github.com/owncloud/ocis/issues/1945
              .willRespondWith({ status: resStatusCode, body: resBody, headers: respHeaders })
          }

          let provider
          if (data.shallGrantAccess) {
            provider = createProvider()
          } else {
            provider = createProvider(false, true)
          }
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)
          await getFileFromPublicLinkInteraction(provider, data)

          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()
            await oc.publicFiles.download(
              shareTokenOfPublicLinkFolder,
              testFiles[2],
              data.passwordWhenListing
            ).then(resp => {
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
            201,
            data.shareParams.password
          )

          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()

            return oc.publicFiles.createFolder(shareTokenOfPublicLinkFolder, 'foo', data.shareParams.password).then((response) => {
              expect(response).toBe(true)
            }).catch(error => {
              fail(error)
            })
          })
        })
        it('should get content of a file', async function () {
          const provider = createProvider()
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)

          await publicShareContentInteraction(
            provider,
            'get content of file in public share' + ' ' + data.description,
            'GET',
            200,
            undefined,
            testContent,
            data.shareParams.password
          )

          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()

            try {
              const resp = await oc.publicFiles.download(shareTokenOfPublicLinkFolder, testFile, data.shareParams.password)
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
            'lorem',
            null,
            data.shareParams.password
          )
          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()
            try {
              const options = {
                previousEntityTag: testFileEtag
              }
              const response = await oc.publicFiles.putFileContents(shareTokenOfPublicLinkFolder, testFile, data.shareParams.password, 'lorem', options)
              expect(typeof response).toBe('object')
            } catch (error) {
              fail(error)
            }
          })
        })

        it('should move a file', async function () {
          const source = shareTokenOfPublicLinkFolder + '/' + testFile
          const target = shareTokenOfPublicLinkFolder + '/lorem123456.txt'

          const provider = createProvider()
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)

          await provider
            .given('provider base url is returned')
          await givenUserExists(provider, testUser)
          await givenFolderExists(provider, testUser, testFolder)
          if (data.shareParams.password) {
            await givenPublicShareExists(
              provider,
              testUser,
              testUserPassword,
              testFolder,
              {
                password: data.shareParams.password,
                permissions: data.shareParams.permissions
              }
            )
          } else {
            await givenPublicShareExists(provider, testUser, testUserPassword, testFolder, { permissions: data.shareParams.permissions })
          }
          await provider.given('file exists in last shared public share', { fileName: testFile, password: data.shareParams.password })
            .uponReceiving(`as '${testUser}', a MOVE request to move a file in public share ${data.description}`)
            .withRequest({
              method: 'MOVE',
              path: MatchersV3.fromProviderState(
                '/remote.php/dav/public-files/${token}/' + testFile, /* eslint-disable-line no-template-curly-in-string */
                `/remote.php/dav/public-files/${shareTokenOfPublicLinkFolder}/${testFile}`
              ),
              headers: {
                ...getPublicLinkAuthHeader(data.shareParams.password),
                Destination: MatchersV3.fromProviderState(
                  '\${providerBaseURL}/remote.php/dav/public-files/\${token}/lorem123456.txt', /* eslint-disable-line */
                  `${mockServerBaseUrl}remote.php/dav/public-files/${shareTokenOfPublicLinkFolder}/lorem123456.txt`)
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
          const source = shareTokenOfPublicLinkFolder + '/' + testFile
          const target = shareTokenOfPublicLinkFolder + '/foo/lorem.txt'

          const provider = createProvider()
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)

          await provider
            .given('provider base url is returned')
          await givenUserExists(provider, testUser)
          await givenFolderExists(provider, testUser, testFolder)
          if (data.shareParams.password) {
            await givenPublicShareExists(
              provider,
              testUser,
              testUserPassword,
              testFolder,
              {
                password: data.shareParams.password,
                permissions: data.shareParams.permissions
              }
            )
          } else {
            await givenPublicShareExists(provider, testUser, testUserPassword, testFolder, { permissions: data.shareParams.permissions })
          }
          await provider.given('folder exists in last shared public share', { folderName: 'foo', password: data.shareParams.password })
            .given('file exists in last shared public share', { fileName: testFile, password: data.shareParams.password })
            .uponReceiving(`as '${testUser}', a MOVE request to move a file to subfolder in public share ${data.description}`)
            .withRequest({
              method: 'MOVE',
              path: MatchersV3.fromProviderState(
                '/remote.php/dav/public-files/${token}/' + testFile, /* eslint-disable-line no-template-curly-in-string */
                `/remote.php/dav/public-files/${shareTokenOfPublicLinkFolder}/${testFile}`
              ),
              headers: {
                ...getPublicLinkAuthHeader(data.shareParams.password),
                Destination: MatchersV3.fromProviderState(
                  '\${providerBaseURL}/remote.php/dav/public-files/\${token}/foo/lorem.txt', /* eslint-disable-line */
                  `${mockServerBaseUrl}remote.php/dav/public-files/${shareTokenOfPublicLinkFolder}/foo/lorem.txt`)
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
          await givenUserExists(provider, testUser)
          await givenFolderExists(provider, testUser, testFolder)
          if (data.shareParams.password) {
            await givenPublicShareExists(
              provider,
              testUser,
              testUserPassword,
              testFolder,
              {
                password: data.shareParams.password,
                permissions: data.shareParams.permissions
              }
            )
          } else {
            await givenPublicShareExists(provider, testUser, testUserPassword, testFolder, { permissions: data.shareParams.permissions })
          }
          await provider.given('folder exists in last shared public share', { folderName: 'foo', password: data.shareParams.password })
            .uponReceiving(`as '${testUser}', a MOVE request to move a folder to different name in public share ${data.description}`)
            .withRequest({
              method: 'MOVE',
              path: MatchersV3.fromProviderState(
                '/remote.php/dav/public-files/${token}/foo', /* eslint-disable-line no-template-curly-in-string */
                `/remote.php/dav/public-files/${shareTokenOfPublicLinkFolder}/foo`
              ),
              headers: {
                ...getPublicLinkAuthHeader(data.shareParams.password),
                Destination: MatchersV3.fromProviderState(
                  '\${providerBaseURL}/remote.php/dav/public-files/\${token}/bar', /* eslint-disable-line */
                  `${mockServerBaseUrl}remote.php/dav/public-files/${shareTokenOfPublicLinkFolder}/bar`
                )
              }
            }).willRespondWith(moveResourceResponse)
          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()
            const source = shareTokenOfPublicLinkFolder + '/' + 'foo'
            const target = shareTokenOfPublicLinkFolder + '/' + 'bar'

            return oc.publicFiles.move(source, target, data.shareParams.password).then((response) => {
              expect(response).toBe(true)
            }).catch(error => {
              fail(error)
            })
          })
        })

        it('should get fileInfo of shared folder', async function () {
          const provider = createProvider(true, true)
          await getCapabilitiesInteraction(provider, testUser, testUserPassword)
          await getCurrentUserInformationInteraction(provider, testUser, testUserPassword)

          await givenUserExists(provider, testUser, testUserPassword)
          await givenFolderExists(provider, testUser, testFolder)
          if (data.shareParams.password) {
            await givenPublicShareExists(
              provider,
              testUser,
              testUserPassword,
              testFolder,
              {
                password: data.shareParams.password,
                permissions: data.shareParams.permissions
              }
            )
          } else {
            await givenPublicShareExists(provider, testUser, testUserPassword, testFolder, { permissions: data.shareParams.permissions })
          }
          await provider
            .uponReceiving(`as '${testUser}', a PROPFIND request to get file info of public share ${data.description}`)
            .withRequest({
              method: 'PROPFIND',
              path: publicLinkShareTokenPath,
              headers: {
                ...getPublicLinkAuthHeader(data.shareParams.password),
                ...xmlResponseHeaders
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
              headers: xmlResponseHeaders,
              body: propfindBody('15')
            })

          return provider.executeTest(async () => {
            const oc = createOwncloud(testUser, testUserPassword)
            await oc.login()
            const sharedFolder = shareTokenOfPublicLinkFolder
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
    for (let fileNum = 0; fileNum < testFiles.length; fileNum++) {
      node.appendElement('d:response', '', dResponse => {
        dResponse.appendElement('d:href', '',
          MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/public-files\\/' +
            '[A-Za-z0-9]+\\/' + encodeURIComponent(testFiles[fileNum]).toLowerCase(),
            '/remote.php/dav/public-files/' +
            shareTokenOfPublicLinkFolder + '/' + encodeURIComponent(testFiles[fileNum]).toLowerCase()
          )
        )
          .appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('d:getcontenttype', '',
                  MatchersV3.regex('text\\/plain(; charset=utf-8)?', 'text/plain')
                )
            })
              .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
          }).appendElement('d:propstat', '', dPropstat => {
            dPropstat.appendElement('d:prop', '', dProp => {
              dProp
                .appendElement('oc:public-link-item-type', '', '')
                .appendElement('oc:public-link-permission', '', '')
                .appendElement('oc:public-link-expiration', '', '')
                .appendElement('oc:public-link-share-datetime', '', '')
                .appendElement('oc:public-link-share-owner', '', '')
            })
              .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 404 Not Found'))
          })
      })
    }
  }

  function propfindBody (permission) {
    return new XmlBuilder('1.0', '', 'd:multistatus').build(dMultistatus => {
      const node = dMultistatus.setAttributes({ 'xmlns:d': 'DAV:', 'xmlns:oc': 'http://owncloud.org/ns' })
        .appendElement('d:response', '', dResponse => {
          dResponse.appendElement('d:href', '', MatchersV3.regex(
            '.*\\/remote\\.php\\/dav\\/public-files\\/[A-Za-z0-9]+\\/',
            `/remote.php/dav/public-files/${shareTokenOfPublicLinkFolder}/`)
          )
            .appendElement('d:propstat', '', dPropstat => {
              dPropstat.appendElement('d:prop', '', dProp => {
                dProp
                  .appendElement('oc:public-link-item-type', '', MatchersV3.equal('folder'))
                  .appendElement('oc:public-link-permission', '', MatchersV3.equal(permission))
                  .appendElement('oc:public-link-share-owner', '', MatchersV3.equal(testUser))
              })
                .appendElement('d:status', '', MatchersV3.equal('HTTP/1.1 200 OK'))
            })
        })
      if (permission === '1') {
        buildPropfindFileList(node)
      }
    })
  }
})
