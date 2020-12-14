describe('oc.publicFiles', function () {
  // CURRENT TIME
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')
  const using = require('jasmine-data-provider')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const {
    validAuthHeaders,
    origin,
    setGeneralInteractions,
    ocsMeta,
    xmlResponseAndAccessControlCombinedHeader,
    htmlResponseAndAccessControlCombinedHeader
  } = require('./pactHelper.js')
  const provider = new Pact.PactWeb()

  const publicLinkShareTokenPath = Pact.Matchers.term({
    matcher: '.*\\/remote\\.php\\/dav\\/public-files\\/' + config.shareTokenOfPublicLinkFolder,
    generate: '/remote.php/dav/public-files/' + config.shareTokenOfPublicLinkFolder + '/'
  })

  const moveResourceResponse = {
    status: 201,
    headers: htmlResponseAndAccessControlCombinedHeader
  }

  const createDeletePublicShare = (description, method, responseBody) => {
    return {
      uponReceiving: description,
      withRequest: {
        method: method,
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: xmlResponseAndAccessControlCombinedHeader,
        body: responseBody
      }
    }
  }

  const createDeleteFolderInPublicShare = (description, method, statusCode) => {
    return {
      uponReceiving: description,
      withRequest: {
        method: method,
        path: Pact.Matchers.regex({
          matcher: `.*\\/remote\\.php\\/dav\\/public-files\\/${config.shareTokenOfPublicLinkFolder}\\/foo`,
          generate: `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/foo`
        })
      },
      willRespondWith: {
        status: statusCode,
        headers: htmlResponseAndAccessControlCombinedHeader
      }
    }
  }

  const createUpdateGetContentInPublicShare = (description, method, statusCode, requestBody = undefined, responseBody = undefined) => {
    return {
      uponReceiving: description,
      withRequest: {
        method: method,
        path: Pact.Matchers.regex({
          matcher: `.*\\/remote\\.php\\/dav\\/public-files\\/${config.shareTokenOfPublicLinkFolder}\\/lorem\\.txt`,
          generate: `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/lorem.txt`
        }),
        headers: {
          Origin: origin
        },
        body: requestBody
      },
      willRespondWith: {
        status: statusCode,
        headers: htmlResponseAndAccessControlCombinedHeader,
        body: responseBody
      }
    }
  }

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

    oc.login().then(() => {
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })

  afterEach(function () {
    oc.logout()
    oc = null
  })

  describe('when creating file urls', function () {
    beforeAll(function (done) {
      Promise.all(setGeneralInteractions(provider)).then(done, done.fail)
    })

    afterAll(function (done) {
      provider.removeInteractions().then(done, done.fail)
    })

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
        expect(oc.publicFiles.getFileUrl(data.token, data.path))
          .toBe(config.owncloudURL + data.expected)
      })
    }
    )
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
        // TESTING CONFIGS
        const testContent = config.testContent

        // CREATED SHARES
        let testFolderShare = null

        beforeAll(async function (done) {
          const promises = []
          promises.push(setGeneralInteractions(provider))
          promises.push(provider.addInteraction(createDeletePublicShare(
            'create a public link share',
            'POST',
            '<?xml version="1.0"?>\n' +
            '<ocs>\n' +
            ' <data>\n' +
            '  <token>' + config.shareTokenOfPublicLinkFolder + '</token>\n' +
            ' </data>\n' +
            '</ocs>\n'
          )))
          if (data.shallGrantAccess) {
            promises.push(provider.addInteraction({
              uponReceiving: 'list content of a public link folder',
              withRequest: {
                method: 'PROPFIND',
                path: publicLinkShareTokenPath
              },
              willRespondWith: {
                status: 207,
                headers: xmlResponseAndAccessControlCombinedHeader,
                body: propfindBody('1')
              }
            }))
          } else {
            promises.push(provider.addInteraction({
              uponReceiving: 'list content of a password protected public link folder using the wrong password',
              withRequest: {
                method: 'PROPFIND',
                path: publicLinkShareTokenPath,
                headers: {
                  Origin: origin
                }
              },
              willRespondWith: {
                status: 401,
                headers: xmlResponseAndAccessControlCombinedHeader,
                body: '<?xml version="1.0" encoding="utf-8"?>\n' +
                  '<d:error xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns">\n' +
                  '  <s:exception>Sabre\\DAV\\Exception\\NotAuthenticated</s:exception>\n' +
                  '</d:error>\n'
              }
            }))
          }

          Promise.all(promises).then(done, done.fail)
        })

        afterAll(function (done) {
          provider.removeInteractions().then(done, done.fail)
        })

        beforeEach(async function (done) {
          oc.shares.shareFileWithLink(config.testFolder, data.shareParams).then(share => {
            expect(typeof (share)).toBe('object')
            testFolderShare = share
            done()
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should list the folder contents', function (done) {
          oc.publicFiles.list(testFolderShare.getToken(), data.passwordWhenListing).then(files => {
            if (data.shallGrantAccess) {
              // test length
              expect(files.length).toBe(4)
              // test root folder
              expect(files[0].getName()).toBe(testFolderShare.getToken())
              expect(files[0].getPath()).toBe('/')
              expect(files[0].getProperty(oc.publicFiles.PUBLIC_LINK_ITEM_TYPE)).toBe('folder')
              expect(files[0].getProperty(oc.publicFiles.PUBLIC_LINK_SHARE_OWNER)).toBe(config.username)
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
            done()
          }).catch(error => {
            if (data.shallGrantAccess) {
              fail(error)
            } else {
              expect(error.statusCode).toBe(401)
            }
            done()
          })
        })

        it('should download files from a public shared folder', async function (done) {
          if (data.shallGrantAccess) {
            await provider.addInteraction({
              uponReceiving: 'download files from a public shared folder',
              withRequest: {
                method: 'GET',
                path: publicLinkShareTokenPath
              },
              willRespondWith: {
                status: 200,
                headers: {
                  'Content-Type': 'text/plain;charset=UTF-8',
                  'Access-Control-Allow-Origin': origin
                },
                body: testContent
              }
            })
          } else {
            await provider.addInteraction({
              uponReceiving: 'download files from a public shared folder using wrong password',
              withRequest: {
                method: 'GET',
                path: publicLinkShareTokenPath
              },
              willRespondWith: {
                status: 401,
                headers: {
                  'Content-Type': 'text/plain;charset=UTF-8',
                  'Access-Control-Allow-Origin': origin
                },
                body: '<?xml version="1.0" encoding="utf-8"?>\n' +
                  '<d:error xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns">\n' +
                  '  <s:exception>Sabre\\DAV\\Exception\\NotAuthenticated</s:exception>\n' +
                  '  <s:message>Username or password was incorrect, No public access to this resource., Username or password was incorrect, Username or password was incorrect</s:message>\n' +
                  '</d:error>'
              }
            })
          }

          return oc.publicFiles.download(testFolderShare.getToken(), config.testFiles[2], data.passwordWhenListing).then(resp => {
            if (data.shallGrantAccess) {
              if (resp.ok) {
                return resp.text().then(text => {
                  expect(text).toEqual(testContent)
                  done()
                })
              }
              fail(resp.statusText)
              done()
            } else {
              expect(resp.status).toBe(401)
              done()
            }
          }).catch(error => {
            if (data.shallGrantAccess) {
              fail(error)
            } else {
              expect(error.statusCode).toBe(401)
              done()
            }
            done()
          })
        })
      })
    })
  })
  describe('when working with files and folder a shared folder', function () {
    using({
      'without password': {
        shareParams: {
          permissions: 15
        }
      },
      'with password': {
        shareParams: {
          password: 'password',
          permissions: 15
        }
      }
    }, function (data, description) {
      describe(description, function () {
        beforeAll(function (done) {
          const promises = []
          promises.push(setGeneralInteractions(provider))
          promises.push(provider.addInteraction(createDeletePublicShare(
            'delete public link share',
            'DELETE',
            ocsMeta('ok', '100')
          )))
          promises.push(provider.addInteraction(createDeleteFolderInPublicShare(
            'create a folder in public share',
            'MKCOL',
            201
          )))

          promises.push(provider.addInteraction(createDeleteFolderInPublicShare(
            'delete a folder in public share',
            'DELETE',
            204
          )))

          promises.push(provider.addInteraction(createUpdateGetContentInPublicShare(
            'put content to file in public share',
            'PUT',
            201,
            config.testContent
          )))

          promises.push(provider.addInteraction(createUpdateGetContentInPublicShare(
            'update content of public share',
            'PUT',
            204,
            'lorem'
          )))

          promises.push(provider.addInteraction(createUpdateGetContentInPublicShare(
            'get content of file in public share',
            'GET',
            200,
            undefined,
            config.testContent
          )))

          Promise.all(promises).then(done, done.fail)
        })

        afterAll(function (done) {
          provider.removeInteractions().then(done, done.fail)
        })

        it('should create a folder', function (done) {
          return oc.publicFiles.createFolder(config.shareTokenOfPublicLinkFolder, 'foo', data.shareParams.password).then(() => {
            return oc.publicFiles.delete(config.shareTokenOfPublicLinkFolder, 'foo', data.shareParams.password).then(() => {
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should create a file', async function () {
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

        it('should update a file', async function () {
          try {
            const resp = await oc.publicFiles.putFileContents(config.shareTokenOfPublicLinkFolder, 'lorem.txt', data.shareParams.password, '123456')
            const options = {
              previousEntityTag: resp.ETag
            }
            const status = await oc.publicFiles.putFileContents(config.shareTokenOfPublicLinkFolder, 'lorem.txt', data.shareParams.password, 'lorem', options)
            expect(typeof status).toBe('object')
          } catch (error) {
            fail(error)
          }
        })

        it('should move a file', async function (done) {
          await provider.addInteraction({
            uponReceiving: 'Move a file',
            withRequest: {
              method: 'MOVE',
              path: Pact.Matchers.regex({
                matcher: `.*\\/remote\\.php\\/dav\\/public-files\\/${config.shareTokenOfPublicLinkFolder}\\/lorem\\.txt`,
                generate: `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/lorem.txt`
              }),
              headers: {
                Origin: origin,
                Destination: `${config.owncloudURL}remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/lorem123456.txt`
              }
            },
            willRespondWith: moveResourceResponse
          })
          const source = config.shareTokenOfPublicLinkFolder + '/lorem.txt'
          const target = config.shareTokenOfPublicLinkFolder + '/lorem123456.txt'
          return oc.publicFiles.move(source, target, data.shareParams.password).then(() => {
            done()
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should move a file to subfolder', async function (done) {
          await provider.addInteraction({
            uponReceiving: 'Move a file to subfolder',
            withRequest: {
              method: 'MOVE',
              path: Pact.Matchers.regex({
                matcher: `.*\\/remote\\.php\\/dav\\/public-files\\/${config.shareTokenOfPublicLinkFolder}\\/lorem123456\\.txt`,
                generate: `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/lorem123456.txt`
              }),
              headers: {
                Origin: origin,
                Destination: `${config.owncloudURL}remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/foo/lorem.txt`
              }
            },
            willRespondWith: moveResourceResponse
          })
          const source = config.shareTokenOfPublicLinkFolder + '/lorem123456.txt'
          const target = config.shareTokenOfPublicLinkFolder + '/foo/lorem.txt'
          return oc.publicFiles.move(source, target, data.shareParams.password).then(() => {
            done()
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should move a folder', async function (done) {
          await provider.addInteraction({
            uponReceiving: 'Move a folder',
            withRequest: {
              method: 'MOVE',
              path: Pact.Matchers.regex({
                matcher: `.*\\/remote\\.php\\/dav\\/public-files\\/${config.shareTokenOfPublicLinkFolder}\\/foo`,
                generate: `/remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/foo`
              }),
              headers: {
                Origin: origin,
                Destination: `${config.owncloudURL}remote.php/dav/public-files/${config.shareTokenOfPublicLinkFolder}/bar`
              }
            },
            willRespondWith: moveResourceResponse
          })
          return oc.publicFiles.createFolder(config.shareTokenOfPublicLinkFolder, 'foo', data.shareParams.password).then(() => {
            const source = config.shareTokenOfPublicLinkFolder + '/' + 'foo'
            const target = config.shareTokenOfPublicLinkFolder + '/' + 'bar'
            return oc.publicFiles.move(source, target, data.shareParams.password).then(() => {
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should get fileInfo of shared folder', async function () {
          await provider.addInteraction({
            uponReceiving: 'Get file info of public share',
            withRequest: {
              method: 'PROPFIND',
              path: publicLinkShareTokenPath,
              headers: {
                Origin: origin
              },
              body: '<?xml version="1.0"?>\n' +
                '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
                '  <d:prop>\n' +
                '    <oc:public-link-item-type />\n' +
                '    <oc:public-link-permission />\n' +
                '    <oc:public-link-expiration />\n' +
                '    <oc:public-link-share-datetime />\n' +
                '    <oc:public-link-share-owner />\n' +
                '    <d:getcontenttype />\n' +
                '  </d:prop>\n' +
                '</d:propfind>'
            },
            willRespondWith: {
              status: 207,
              headers: xmlResponseAndAccessControlCombinedHeader,
              body: propfindBody('15')
            }
          })
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

  function buildPropfindFileList () {
    let contentResponse = ''
    for (let fileNum = 0; fileNum < config.testFiles.length; fileNum++) {
      contentResponse +=
        '<d:response>\n' +
        // TODO add ${SUBFOLDER} in the href
        '   <d:href>/remote.php/dav/public-files/' + config.shareTokenOfPublicLinkFolder + '/' +
        encodeURIComponent(config.testFiles[fileNum]) + '</d:href>\n' +
        '   <d:propstat>\n' +
        '      <d:prop>\n' +
        '         <d:getcontenttype>text/plain</d:getcontenttype>\n' +
        '      </d:prop>\n' +
        '      <d:status>HTTP/1.1 200 OK</d:status>\n' +
        '   </d:propstat>\n' +
        '   <d:propstat>\n' +
        '      <d:prop>\n' +
        '         <oc:public-link-item-type />\n' +
        '         <oc:public-link-permission />\n' +
        '         <oc:public-link-expiration />\n' +
        '         <oc:public-link-share-datetime />\n' +
        '         <oc:public-link-share-owner />\n' +
        '      </d:prop>\n' +
        '      <d:status>HTTP/1.1 404 Not Found</d:status>\n' +
        '   </d:propstat>\n' +
        '</d:response>\n'
    }
    return contentResponse
  }

  function propfindBody (permission) {
    const response = permission === '1' ? buildPropfindFileList() : ''
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
      '   <d:response>\n' +
      '      <d:href>/remote.php/dav/public-files/' + config.shareTokenOfPublicLinkFolder + '/</d:href>\n' +
      '      <d:propstat>\n' +
      '         <d:prop>\n' +
      '            <oc:public-link-item-type>folder</oc:public-link-item-type>\n' +
      '            <oc:public-link-permission>' + permission + '</oc:public-link-permission>\n' +
      '            <oc:public-link-share-owner>' + config.username + '</oc:public-link-share-owner>\n' +
      '         </d:prop>\n' +
      '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
      '      </d:propstat>\n' +
      '   </d:response>\n' +
      response +
      '</d:multistatus>'
  }
})
