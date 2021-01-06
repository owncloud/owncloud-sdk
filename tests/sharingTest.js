describe('Main: Currently testing file/folder sharing,', function () {
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    applicationXmlResponseHeaders,
    accessControlAllowHeaders,
    accessControlAllowMethods,
    validAuthHeaders,
    xmlResponseHeaders,
    CORSPreflightRequest,
    capabilitiesGETRequestValidAuth,
    GETRequestToCloudUserEndpoint,
    createOwncloud,
    ocsMeta,
    shareResponseOcsData,
    deleteResource
  } = require('./pactHelper.js')

  // TESTING CONFIGS
  const testUserPassword = config.testUserPassword
  const testUser = config.testUser
  const testGroup = config.testGroup
  const testFolder = '/' + config.testFolder
  const nonExistentFile = config.nonExistentFile
  const expirationDate = config.expirationDate
  const testFiles = config.testFiles

  // CREATED SHARES
  const sharedFiles = {
    'test space and + and #.txt': 18,
    'test.txt': 14,
    '文件.txt': 19
  }
  const testFolderShareID = 9

  // CONSTANTS FROM lib/public/constants.php
  const OCS_PERMISSION_READ = 1
  const OCS_PERMISSION_UPDATE = 2
  const OCS_PERMISSION_CREATE = 4
  const OCS_PERMISSION_SHARE = 16

  const aGetRequestForAShareWithShareName = function (name, shareType, iteration) {
    const path = ['%2Ftest.txt', '%2Ftest%20space%20and%20%2B%20and%20%23.txt', '%2F%E6%96%87%E4%BB%B6.txt']
    return {
      uponReceiving: 'a GET request for a ' + name + path[iteration],
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        }),
        query: 'path=' + path[iteration],
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          'Access-Control-Allow-Methods': accessControlAllowMethods
        },
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ocsMeta('ok', '100') +
          ' <data>\n' +
          '  <element>\n' +
           shareResponseOcsData(shareType, config.testFilesId[iteration], 1, config.testFiles[iteration]) +
          '   <token>' + config.testFilesToken[iteration] + '</token>\n' +
          '  </element>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    }
  }

  const aGetRequestForPublicLinkShare = function (name, permissions, additionalBodyElem) {
    return {
      uponReceiving: 'a GET request for a public link share' + name,
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/\\d+$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/9'
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          'Access-Control-Allow-Methods': accessControlAllowMethods
        },
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ocsMeta('ok', '100') +
          ' <data>\n' +
          '  <element>\n' +
          shareResponseOcsData(3, 17, permissions, testFolder) +
          additionalBodyElem +
          '  <name>Öffentlicher Link</name>\n' +
          '  </element>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    }
  }

  beforeEach(function (done) {
    const promises = []
    promises.push(provider.addInteraction(CORSPreflightRequest()))
    promises.push(provider.addInteraction(capabilitiesGETRequestValidAuth()))
    promises.push(provider.addInteraction(GETRequestToCloudUserEndpoint()))
    Promise.all(promises).then(done, done.fail)
  })

  afterEach(async function (done) {
    provider.removeInteractions().then(done, done.fail)
  })

  beforeEach(function () {
    oc = createOwncloud()
    return oc.login()
  })

  afterAll(async function (done) {
    oc.logout()
    oc = null
    await provider.verify()
    provider.removeInteractions().then(done, done.fail)
  })

  describe('Currently testing folder sharing,', function () {
    describe('sharedFolder,', function () {
      // needs to be double checked ...
      describe('updating share permissions,', function () {
        it('confirms not changed permissions', async function (done) {
          await provider.addInteraction(
            aGetRequestForPublicLinkShare('to confirm the permissions is not changed', 1, ''))
          oc.shares.getShare(testFolderShareID).then(share => {
            // permissions would still be read only as the share is public
            expect(share.getPermissions()).toEqual(1)
            done()
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        })
      })

      // needs to be double checked
      describe('making publicUpload true,', function () {
        it('confirms publicUpload true', async function (done) {
          await provider.addInteraction(
            aGetRequestForPublicLinkShare('after making publicupload true', 15, ''))
          oc.shares.getShare(testFolderShareID).then(share => {
            expect(share.getPermissions() & OCS_PERMISSION_CREATE).toBeGreaterThan(0)
            expect(share.getPermissions() & OCS_PERMISSION_UPDATE).toBeGreaterThan(0)
            done()
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        })
      })

      // needs to be double checked
      describe('adding password,', function () {
        const additionalBodyElement = '  <share_with>***redacted***</share_with>\n' +
                  '  <share_with_displayname>***redacted***</share_with_displayname>\n'

        it('confirms added password', async function (done) {
          await provider.addInteraction(
            aGetRequestForPublicLinkShare('after password is added', 1, additionalBodyElement))
          oc.shares.getShare(testFolderShareID).then(async share => {
            expect(typeof (share.getShareWith())).toEqual('string')
            expect(typeof (share.getShareWithDisplayName())).toEqual('string')
            done()
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        })
      })
    })
  })

  describe('Currently testing file sharing,', function () {
    describe('sharedFilesByLink,', function () {
      describe('checking the shared files,', function () {
        beforeEach(async function (done) {
          const promises = []
          for (let i = 0; i < config.testFiles.length; i++) {
            promises.push(provider.addInteraction(aGetRequestForAShareWithShareName('public link share',
              3, i)))
          }
          Promise.all(promises).then(done, done.fail)
        })
        it('checking method : isShared with shared file', function (done) {
          let count = 0
          for (let i = 0; i < testFiles.length; i++) {
            oc.shares.isShared(testFiles[i]).then(status => {
              expect(status).toEqual(true)
              count++
              if (count === testFiles.length) {
                done()
              }
            }).catch(error => {
              expect(error).toBe(null)
              done()
            })
          }
        })

        it('checking method : getShares for shared file', function (done) {
          let count = 0
          const allIDs = []
          for (const file in sharedFiles) {
            allIDs.push(sharedFiles[file])
          }

          for (let i = 0; i < testFiles.length; i++) {
            oc.shares.getShares(testFiles[i]).then(shares => {
              expect(shares.constructor).toBe(Array)
              let flag = 0
              for (let i = 0; i < shares.length; i++) {
                const share = shares[i]
                if (allIDs.indexOf(share.getId()) > -1) {
                  flag = 1
                }
              }
              expect(flag).toEqual(1)
              count++
              if (count === testFiles.length) {
                done()
              }
            }).catch(error => {
              expect(error).toBe(null)
              done()
            })
          }
        })
      })

      it('checking method : getShare with existent share', async function (done) {
        for (let i = 0; i < config.testFiles.length; i++) {
          await provider.addInteraction({
            uponReceiving: 'a GET request for an existent share with id ' + config.testFilesId[i],
            withRequest: {
              method: 'GET',
              path: Pact.Matchers.term({
                matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/' + config.testFilesId[i] + '$',
                generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/' + config.testFilesId[i]
              }),
              headers: validAuthHeaders
            },
            willRespondWith: {
              status: 200,
              headers: xmlResponseHeaders,
              body: '<?xml version="1.0"?>\n' +
                '<ocs>\n' +
                ocsMeta('ok', '100') +
                ' <data>\n' +
                '  <element>\n' +
                shareResponseOcsData(0, config.testFilesId[i], 19, config.testFiles[i]) +
                '  </element>\n' +
                ' </data>\n' +
                '</ocs>'
            }
          })
        }
        let count = 0
        for (const file in sharedFiles) {
          oc.shares.getShare(sharedFiles[file]).then(share => {
            expect(typeof (share)).toBe('object')
            expect(Object.prototype.hasOwnProperty.call(sharedFiles, share.getId())).toBeGreaterThan(-1)
            count++
            if (count === Object.keys(sharedFiles).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })
    })

    describe('sharedFilesWithUser,', function () {
      beforeEach(function (done) {
        const promises = []
        for (let i = 0; i < config.testFiles.length; i++) {
          promises.push(provider.addInteraction(aGetRequestForAShareWithShareName(
            'user share ', 0, i)))
        }
        Promise.all(promises).then(done, done.fail)
      })

      afterEach(function (done) {
        provider.removeInteractions().then(done, done.fail)
      })

      describe('updating permissions', function () {
        afterEach(function (done) {
          provider.removeInteractions().then(done, done.fail)
        })

        it('confirms updated permissions', async function (done) {
          await provider.addInteraction(
            aGetRequestForPublicLinkShare('after confirming updated permission', 19, ''))
          const maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE
          let count = 0

          for (const file in sharedFiles) {
            oc.shares.getShare(sharedFiles[file]).then(share => {
              expect(share.getPermissions()).toEqual(maxPerms)
              count++
              if (count === Object.keys(sharedFiles).length) {
                done()
              }
            }).catch(error => {
              expect(error).toBe(null)
              done()
            })
          }
        })
      })

      it('checking method : isShared with shared file', function (done) {
        let count = 0

        for (const file in sharedFiles) {
          oc.shares.isShared(file).then(status => {
            expect(status).toEqual(true)
            count++
            if (count === Object.keys(sharedFiles).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      it('checking method : getShare with existent share', async function (done) {
        await provider.addInteraction(
          aGetRequestForPublicLinkShare('to confirm the share', 1, ''))
        let count = 0

        for (const file in sharedFiles) {
          oc.shares.getShare(sharedFiles[file]).then(share => {
            expect(typeof (share)).toBe('object')
            expect(Object.prototype.hasOwnProperty.call(sharedFiles, share.getId())).toBeGreaterThan(-1)
            count++
            if (count === Object.keys(sharedFiles).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      it('checking method : getShares for shared file', function (done) {
        let count = 0
        const allIDs = []

        for (var file in sharedFiles) {
          allIDs.push(sharedFiles[file])
        }

        for (file in sharedFiles) {
          oc.shares.getShares(file).then(shares => {
            expect(shares.constructor).toBe(Array)
            let flag = 0
            for (let i = 0; i < shares.length; i++) {
              const share = shares[i]
              if (allIDs.indexOf(share.getId()) > -1) {
                flag = 1
              }
            }
            expect(flag).toEqual(1)
            count++
            if (count === Object.keys(sharedFiles).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })
    })

    describe('sharedFilesWithGroup,', function () {
      beforeEach(function (done) {
        const promises = []
        for (let i = 0; i < config.testFiles.length; i++) {
          promises.push(provider.addInteraction(aGetRequestForAShareWithShareName(
            'group share ', 1, i)))
        }
        Promise.all(promises).then(done, done.fail)
      })

      it('checking method : isShared with shared file', function (done) {
        let count = 0
        for (const file in sharedFiles) {
          oc.shares.isShared(file).then(status => {
            expect(status).toEqual(true)
            count++
            if (count === Object.keys(sharedFiles).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      it('checking method : getShare with existent share', async function (done) {
        await provider.addInteraction(
          aGetRequestForPublicLinkShare('of existing file', 14, ''))
        let count = 0

        for (const file in sharedFiles) {
          oc.shares.getShare(sharedFiles[file]).then(share => {
            expect(typeof (share)).toBe('object')
            expect(Object.prototype.hasOwnProperty.call(sharedFiles, share.getId())).toBeGreaterThan(-1)
            count++
            if (count === Object.keys(sharedFiles).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      it('checking method : getShares for shared file', function (done) {
        let count = 0
        const allIDs = []
        for (var file in sharedFiles) {
          allIDs.push(sharedFiles[file])
        }

        for (file in sharedFiles) {
          oc.shares.getShares(file).then(shares => {
            expect(shares.constructor).toBe(Array)
            let flag = 0
            for (let i = 0; i < shares.length; i++) {
              const share = shares[i]
              if (allIDs.indexOf(share.getId()) > -1) {
                flag = 1
              }
            }
            expect(flag).toEqual(1)
            count++
            if (count === Object.keys(sharedFiles).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })
    })

    describe('checking method: ', function () {
      beforeEach(function (done) {
        const promises = []

        promises.push(provider.addInteraction({
          uponReceiving: 'a link share POST request with a non-existent file',
          withRequest: {
            method: 'POST',
            path: Pact.Matchers.term({
              matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
              generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
            }),
            headers: validAuthHeaders,
            body: 'shareType=3' + '&path=%2F' + config.nonExistentFile + '&password=' + config.testUserPassword
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': accessControlAllowHeaders,
              'Access-Control-Allow-Methods': accessControlAllowMethods
            },
            body: '<?xml version="1.0"?>\n' +
              '<ocs>\n' +
              ocsMeta('failure', 404, 'Wrong path, file/folder doesn\'t exist') +
              ' <data/>\n' +
              '</ocs>'
          }
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'a group share POST request with valid auth but non-existent file',
          withRequest: {
            method: 'POST',
            path: Pact.Matchers.term({
              matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
              generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
            }),
            headers: validAuthHeaders,
            body: 'shareType=1&shareWith=' + config.testGroup + '&path=%2F' + config.nonExistentFile + '&permissions=19'
          },
          willRespondWith: {
            status: 200,
            headers: applicationXmlResponseHeaders,
            body: '<?xml version="1.0"?>\n' +
              '<ocs>\n' +
              ocsMeta('failure', 404, 'Wrong path, file/folder doesn\'t exist') +
              ' <data/>\n' +
              '</ocs>'
          }
        }))
        promises.push(provider.addInteraction({
          uponReceiving: 'a GET request for a share with non-existent file',
          withRequest: {
            method: 'GET',
            path: Pact.Matchers.term({
              matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
              generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
            }),
            query: 'path=%2F' + config.nonExistentFile,
            headers: validAuthHeaders
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': accessControlAllowHeaders,
              'Access-Control-Allow-Methods': accessControlAllowMethods
            },
            body: '<?xml version="1.0"?>\n' +
                '<ocs>\n' +
                ocsMeta('failure', 404, 'Wrong path, file/folder doesn\'t exist') +
                ' <data/>\n' +
                '</ocs>'
          }
        })
        )
        promises.push(provider.addInteraction({
          uponReceiving: 'a GET request for an existent but non-shared file',
          withRequest: {
            method: 'GET',
            path: Pact.Matchers.term({
              matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
              generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
            }),
            query: 'path=%2FnewFileCreated123',
            headers: validAuthHeaders
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': accessControlAllowHeaders,
              'Access-Control-Allow-Methods': accessControlAllowMethods
            },
            body: '<?xml version="1.0"?>\n' +
                '<ocs>\n' +
                ocsMeta('ok', '100') +
                ' <data/>\n' +
                '</ocs>'
          }
        })
        )
        promises.push(provider.addInteraction({
          uponReceiving: 'a GET request for a non-existent share',
          withRequest: {
            method: 'GET',
            path: Pact.Matchers.term({
              matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/-1$',
              generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/-1'
            }),
            headers: validAuthHeaders
          },
          willRespondWith: {
            status: 200,
            headers: xmlResponseHeaders,
            body: '<?xml version="1.0"?>\n' +
                '<ocs>\n' +
                ocsMeta('failure', 404, 'Wrong share ID, share doesn\'t exist') +
                ' <data/>\n' +
                '</ocs>'
          }
        })
        )
        promises.push(provider.addInteraction({
          uponReceiving: 'Put file contents as empty content in files specified',
          withRequest: {
            method: 'PUT',
            path: Pact.Matchers.regex({
              matcher: '.*\\/remote\\.php\\/webdav\\/newFileCreated123$',
              generate: '/remote.php/webdav/newFileCreated123'
            }),
            headers: validAuthHeaders
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': origin
            }
          }
        })
        )
        for (let i = 0; i < config.testFiles.length; i++) {
          promises.push(provider.addInteraction({
            uponReceiving: 'a GET request for an existent share with id ' + config.testFilesId[i],
            withRequest: {
              method: 'GET',
              path: Pact.Matchers.term({
                matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/' + config.testFilesId[i] + '$',
                generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/' + config.testFilesId[i]
              }),
              headers: validAuthHeaders
            },
            willRespondWith: {
              status: 200,
              headers: xmlResponseHeaders,
              body: '<?xml version="1.0"?>\n' +
                '<ocs>\n' +
                ocsMeta('ok', '100') +
                ' <data>\n' +
                '  <element>\n' +
                shareResponseOcsData(0, config.testFilesId[i], 19, config.testFiles[i]) +
                '  </element>\n' +
                ' </data>\n' +
                '</ocs>'
            }
          }))
        }

        const requests = ['PUT', 'DELETE']
        for (let i = 0; i < requests.length; i++) {
          promises.push(provider.addInteraction({
            uponReceiving: 'a ' + requests[i] + ' request to update/delete a non-existent share',
            withRequest: {
              method: requests[i],
              path: Pact.Matchers.regex({
                matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/-1$',
                generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/-1'
              }),
              headers: validAuthHeaders
            },
            willRespondWith: {
              status: 200,
              headers: {
                'Access-Control-Allow-Origin': origin
              },
              body: '<?xml version="1.0"?>\n' +
                '<ocs>\n' +
                ocsMeta('failure', 404, 'Wrong share ID, share doesn\'t exist') +
                ' <data/>\n' +
                '</ocs>'
            }
          }))
        }

        for (let i = 0; i < config.testFiles.length; i++) {
          promises.push(provider.addInteraction({
            uponReceiving: 'a user share POST request with valid auth and expiration date set to path ' + config.testFilesPath[i],
            withRequest: {
              method: 'POST',
              path: Pact.Matchers.term({
                matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
                generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
              }),
              headers: validAuthHeaders,
              body: 'shareType=0&shareWith=' + config.testUser + '&path=' + config.testFilesPath[i] + '&expireDate=' + config.expirationDate
            },
            willRespondWith: {
              status: 200,
              headers: applicationXmlResponseHeaders,
              body: '<?xml version="1.0"?>\n' +
                  '<ocs>\n' +
                  ocsMeta('ok', '100') +
                  ' <data>\n' +
                  shareResponseOcsData(0, config.testFilesId[i], 19, config.testFiles[i]) +
                  '  <expiration>' + config.expirationDate + '</expiration>\n' +
                  ' </data>\n' +
                  '</ocs>'
            }
          })
          )
        }

        promises.push(provider.addInteraction(deleteResource('newFileCreated123', 'file')))

        Promise.all(promises).then(done, done.fail)
      })

      it('shareFileWithLink with non-existent file', function (done) {
        oc.shares.shareFileWithLink(nonExistentFile, { password: testUserPassword }).then(status => {
          expect(status).toBe(null)
          done()
        }).catch(error => {
          expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
          done()
        })
      })

      it('shareFileWithGroup with non existent file', function (done) {
        oc.shares.shareFileWithGroup(nonExistentFile, testGroup, { permissions: 19 }).then(share => {
          expect(share).toBe(null)
          done()
        }).catch(error => {
          expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
          done()
        })
      })

      it('isShared with non existent file', function (done) {
        oc.shares.isShared(nonExistentFile).then(status => {
          expect(status).toBe(null)
          done()
        }).catch(error => {
          expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
          done()
        })
      })

      it('isShared with existent but non shared file', function (done) {
        const suffix = '123'
        oc.files.putFileContents('newFileCreated' + suffix).then(status => {
          expect(typeof status).toBe('object')
          return oc.shares.isShared('newFileCreated' + suffix)
        }).then(isShared => {
          expect(isShared).toEqual(false)
          // DELETING THE NEWLY CREATED FILE
          return oc.files.delete('newFileCreated' + suffix)
        }).then(status2 => {
          expect(status2).toBe(true)
          done()
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
      })

      it('getShare with non existent share', function (done) {
        oc.shares.getShare(-1).then(share => {
          expect(share).toBe(null)
          done()
        }).catch(error => {
          if (error.slice(-1) === '.') {
            error = error.slice(0, -1)
          }
          expect(error.toLowerCase()).toEqual('wrong share id, share doesn\'t exist')
          done()
        })
      })

      it('getShares for non existent file', function (done) {
        oc.shares.getShares(nonExistentFile).then(shares => {
          expect(shares).toBe(null)
          done()
        }).catch(error => {
          expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
          done()
        })
      })

      it('getShares for existent but non shared file', function (done) {
        const suffix = '123'
        oc.files.putFileContents('newFileCreated' + suffix).then(status => {
          expect(typeof status).toBe('object')
          return oc.shares.getShares('newFileCreated' + suffix)
        }).then(shares => {
          expect(shares.constructor).toEqual(Array)
          expect(shares.length).toEqual(0)
          // DELETING THE NEWLY CREATED FILE
          return oc.files.delete('newFileCreated' + suffix)
        }).then(status2 => {
          expect(status2).toBe(true)
          done()
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
      })

      it('updateShare for non existent share', function (done) {
        oc.shares.updateShare(-1).then(status => {
          expect(status).toBe(null)
          done()
        }).catch(error => {
          if (error.slice(-1) === '.') {
            error = error.slice(0, -1)
          }
          expect(error.toLowerCase()).toBe('wrong share id, share doesn\'t exist')
          done()
        })
      })

      it('deleteShare with non existent share', function (done) {
        oc.shares.deleteShare(-1).then(status => {
          expect(status).toBe(true)
          done()
        }).catch(error => {
          if (error.slice(-1) === '.') {
            error = error.slice(0, -1)
          }
          expect(error.toLowerCase()).toBe('wrong share id, share doesn\'t exist')
          done()
        })
      })

      it('should share a file with another user when expiration date is set', function (done) {
        let count = 0

        for (let i = 0; i < testFiles.length; i++) {
          oc.shares.shareFileWithUser(
            testFiles[i],
            testUser,
            { expirationDate: expirationDate }
          ).then(share => {
            expect(share).not.toBe(null)
            expect(typeof share).toBe('object')
            expect(typeof share.getId()).toBe('number')
            expect(typeof share.getExpiration()).toBe('number')
            count++

            if (count === testFiles.length) {
              done()
            }
          }).catch(error => {
            fail(error)
          })
        }
      })
    })
  })
})
