describe('oc.publicFiles', function () {
  // CURRENT TIME
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')
  const using = require('jasmine-data-provider')

  // LIBRARY INSTANCE
  let oc

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
        const uniqueId = Math.random().toString(36).substr(2, 9)
        const testContent = 'testContent'
        const testFolder = '/testFolder' + uniqueId

        // CREATED SHARES
        let testFolderShare = null

        const testFiles = [
          '文件' + uniqueId + '.txt',
          'test' + uniqueId + '.txt',
          'test space and + and #' + uniqueId + '.txt'
        ]

        beforeEach(function (done) {
          oc.files.createFolder(testFolder).then(() => {
            let count = 0
            for (let i = 0; i < testFiles.length; i++) {
              // CREATING TEST FILES
              oc.files.putFileContents(testFolder + '/' + testFiles[i], testContent).then(status => {
                expect(typeof status).toBe('object')
                count++
                if (count === testFiles.length) {
                  oc.shares.shareFileWithLink(testFolder, data.shareParams).then(share => {
                    expect(typeof (share)).toBe('object')
                    testFolderShare = share
                    done()
                  }).catch(error => {
                    fail(error)
                    done()
                  })
                }
              }).catch(error => {
                fail(error)
                done()
              })
            }
          })
        })

        afterEach(function (done) {
          oc.shares.deleteShare(testFolderShare.getId()).then(status => {
            expect(status).toBe(true)
            oc.files.delete(testFolder).then(status => {
              expect(status).toBe(true)
              done()
            }).catch(error => {
              fail(error)
              done()
            })
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
              expect(files[1].getName()).toBe(testFiles[2])
              expect(files[1].getPath()).toBe('/' + testFolderShare.getToken() + '/')

              expect(files[2].getName()).toBe(testFiles[1])
              expect(files[2].getPath()).toBe('/' + testFolderShare.getToken() + '/')

              expect(files[3].getName()).toBe(testFiles[0])
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
          return oc.publicFiles.download(testFolderShare.getToken(), testFiles[2], data.passwordWhenListing).then(resp => {
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
  describe('when creating files and folder a shared folder', function () {
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
            return oc.files.delete(testFolder).then(status => {
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should create a folder', function (done) {
          return oc.publicFiles.createFolder(testFolderShare.getToken(), 'foo', data.shareParams.password).then(resp => {
            return oc.publicFiles.delete(testFolderShare.getToken(), 'foo', data.shareParams.password).then(resp => {
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should create a file', function (done) {
          return oc.publicFiles.putFileContents(testFolderShare.getToken(), 'lorem.txt', data.shareParams.password, '123456').then(resp => {
            return oc.publicFiles.delete(testFolderShare.getToken(), 'lorem.txt', data.shareParams.password).then(resp => {
              done()
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })

        it('should update a file', function (done) {
          return oc.publicFiles.putFileContents(testFolderShare.getToken(), 'lorem.txt', data.shareParams.password, '123456').then(resp => {
            const options = {
              previousEntityTag: resp['ETag']
            }
            return oc.publicFiles.putFileContents(testFolderShare.getToken(), 'lorem.txt', data.shareParams.password, 'lorem', options).then(resp => {
              return oc.publicFiles.delete(testFolderShare.getToken(), 'lorem.txt', data.shareParams.password).then(resp => {
                done()
              })
            })
          }).catch(error => {
            fail(error)
            done()
          })
        })
      })
    })
  })
})
