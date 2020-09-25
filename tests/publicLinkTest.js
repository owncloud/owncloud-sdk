describe('oc.publicFiles', function () {
  // CURRENT TIME
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')
  const using = require('jasmine-data-provider')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const { validAuthHeaders, setGeneralInteractions } = require('./pactHelper.js')
  const provider = new Pact.PactWeb()

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

  fdescribe('when creating file urls', function () {
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

  fdescribe('when listing a shared folder', function () {
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
        const testContent = 'testContent'

        // CREATED SHARES
        let testFolderShare = null

        beforeAll(async function (done) {
          const promises = []
          promises.push(setGeneralInteractions(provider))
          promises.push(provider.addInteraction({
            uponReceiving: 'create a public link share',
            withRequest: {
              method: 'POST',
              path: Pact.Matchers.regex({
                matcher: '.*\\/ocs\\/v(1|2)\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares',
                generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
              }),
              headers: validAuthHeaders
            },
            willRespondWith: {
              status: 200,
              headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Access-Control-Allow-Origin': origin
              },
              body: '<?xml version="1.0"?>\n' +
                '<ocs>\n' +
                ' <data>\n' +
                '  <token>' + config.shareTokenOfPublicLinkFolder + '</token>\n' +
                ' </data>\n' +
                '</ocs>\n'
            }
          }))
          if (data.shallGrantAccess) {
            promises.push(provider.addInteraction({
              uponReceiving: 'list content of a public link folder',
              withRequest: {
                method: 'PROPFIND',
                path: Pact.Matchers.term({
                  matcher: '.*\\/remote\\.php\\/dav\\/public-files\\/' + config.shareTokenOfPublicLinkFolder,
                  generate: '/remote.php/dav/public-files/' + config.shareTokenOfPublicLinkFolder + '/'
                })
              },
              willRespondWith: {
                status: 207,
                headers: {
                  'Content-Type': 'application/xml; charset=utf-8',
                  'Access-Control-Allow-Origin': origin
                },
                body: propfindBody(config.shareTokenOfPublicLinkFolder)
              }
            }))
          } else {
            promises.push(provider.addInteraction({
              uponReceiving: 'list content of a password protected public link folder using the wrong password',
              withRequest: {
                method: 'PROPFIND',
                path: Pact.Matchers.term({
                  matcher: '.*\\/remote\\.php\\/dav\\/public-files\\/' + config.shareTokenOfPublicLinkFolder,
                  generate: '/remote.php/dav/public-files/' + config.shareTokenOfPublicLinkFolder + '/'
                }),
                headers: {
                  Origin: origin
                }
              },
              willRespondWith: {
                status: 401,
                headers: {
                  'Content-Type': 'application/xml; charset=utf-8',
                  'Access-Control-Allow-Origin': origin
                },
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

        fit('should list the folder contents', function (done) {
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

        it('should download files from a public shared folder', function (done) {
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
        // TESTING CONFIGS
        const uniqueId = Math.random().toString(36).substr(2, 9)
        const testFolder = '/testFolder' + uniqueId

        // CREATED SHARES
        let testFolderShare = null

        beforeEach(function (done) {
          return oc.files.createFolder(testFolder).then(() => {
            return oc.shares.shareFileWithLink(testFolder, data.shareParams).then(share => {
              expect(typeof (share)).toBe('object')
              expect(share.getPermissions()).toBe(15)
              testFolderShare = share
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })

        afterEach(function (done) {
          return oc.shares.deleteShare(testFolderShare.getId()).then(() => {
            return oc.files.delete(testFolder).then(() => {
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should create a folder', function (done) {
          return oc.publicFiles.createFolder(testFolderShare.getToken(), 'foo', data.shareParams.password).then(() => {
            return oc.publicFiles.delete(testFolderShare.getToken(), 'foo', data.shareParams.password).then(() => {
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
              testFolderShare.getToken(),
              newFile,
              data.shareParams.password,
              testContent,
              options
            )
            expect(typeof status).toBe('object')
            expect(progressCalled).toEqual(true)
            const resp = await oc.publicFiles.download(testFolderShare.getToken(), newFile, data.shareParams.password)
            const content = await resp.text()
            expect(content).toEqual(testContent)
            await oc.publicFiles.delete(testFolderShare.getToken(), newFile, data.shareParams.password)
          } catch (error) {
            fail(error)
          }
        })

        it('should update a file', async function () {
          try {
            const resp = await oc.publicFiles.putFileContents(testFolderShare.getToken(), 'lorem.txt', data.shareParams.password, '123456')
            const options = {
              previousEntityTag: resp.ETag
            }
            const status = await oc.publicFiles.putFileContents(testFolderShare.getToken(), 'lorem.txt', data.shareParams.password, 'lorem', options)
            expect(typeof status).toBe('object')
            await oc.publicFiles.delete(testFolderShare.getToken(), 'lorem.txt', data.shareParams.password)
          } catch (error) {
            fail(error)
          }
        })

        it('should move a file', function (done) {
          return oc.publicFiles.putFileContents(testFolderShare.getToken(), 'lorem.txt', data.shareParams.password, '123456').then(() => {
            const source = testFolderShare.getToken() + '/lorem.txt'
            const target = testFolderShare.getToken() + '/lorem123456.txt'
            // move in root
            return oc.publicFiles.move(source, target, data.shareParams.password).then(() => {
              // move into subfolder
              return oc.publicFiles.createFolder(testFolderShare.getToken(), 'foo', data.shareParams.password).then(() => {
                const source = testFolderShare.getToken() + '/lorem123456.txt'
                const target = testFolderShare.getToken() + '/foo/lorem.txt'
                return oc.publicFiles.move(source, target, data.shareParams.password).then(() => {
                  done()
                })
              })
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should move a folder', function (done) {
          return oc.publicFiles.createFolder(testFolderShare.getToken(), 'foo', data.shareParams.password).then(() => {
            const source = testFolderShare.getToken() + '/' + 'foo'
            const target = testFolderShare.getToken() + '/' + 'bar'
            // move in root
            return oc.publicFiles.move(source, target, data.shareParams.password).then(() => {
              // move into subfolder
              return oc.publicFiles.createFolder(testFolderShare.getToken(), 'foo', data.shareParams.password).then(() => {
                const source = testFolderShare.getToken() + '/' + 'bar'
                const target = testFolderShare.getToken() + '/foo/bar'
                return oc.publicFiles.move(source, target, data.shareParams.password).then(() => {
                  done()
                })
              })
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should get fileInfo of shared folder', async function () {
          const sharedFolder = testFolderShare.getToken()
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

  function buildPropfindFileList (token) {
    let contentResponse = ''
    for (let fileNum = 0; fileNum < config.testFiles.length; fileNum++) {
      contentResponse +=
        '<d:response>\n' +
        // TODO add ${SUBFOLDER} in the href
        '   <d:href>/remote.php/dav/public-files/' + token + '/' +
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

  function propfindBody (token) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">\n' +
      '   <d:response>\n' +
      '      <d:href>/owncloud-core/remote.php/dav/public-files/' + token + '/</d:href>\n' +
      '      <d:propstat>\n' +
      '         <d:prop>\n' +
      '            <oc:public-link-item-type>folder</oc:public-link-item-type>\n' +
      '            <oc:public-link-permission>1</oc:public-link-permission>\n' +
      '            <oc:public-link-share-owner>' + config.username + '</oc:public-link-share-owner>\n' +
      '         </d:prop>\n' +
      '         <d:status>HTTP/1.1 200 OK</d:status>\n' +
      '      </d:propstat>\n' +
      '   </d:response>\n' +
      buildPropfindFileList(token) +
      '</d:multistatus>'
  }
})
