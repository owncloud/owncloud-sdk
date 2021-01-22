import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing file/folder sharing,', function () {
  const config = require('./config/config.json')

  const {
    applicationXmlResponseHeaders,
    accessControlAllowHeaders,
    accessControlAllowMethods,
    validAuthHeaders,
    xmlResponseHeaders,
    capabilitiesGETRequestValidAuth,
    GETRequestToCloudUserEndpoint,
    createOwncloud,
    ocsMeta,
    shareResponseOcsData,
    createProvider,
    origin
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

  const aGetRequestForAShareWithShareName = function (provider, name, shareType, file) {
    const iteration = testFiles.indexOf(file)
    const fileId = config.testFilesId[iteration]
    const fileToken = config.testFilesToken[iteration]
    return provider.uponReceiving('a GET request for a ' + name + file)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        ),
        query: { path: '/' + file },
        headers: validAuthHeaders
      }).willRespondWith({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          'Access-Control-Allow-Methods': accessControlAllowMethods,
          ...applicationXmlResponseHeaders
        },
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', data => {
            data.appendElement('element', '', element => {
              shareResponseOcsData(element, shareType, fileId, 1, file)
                .appendElement('token', '', fileToken)
            })
          })
        })
      })
  }

  const aGetRequestForPublicLinkShare = function (provider, name, permissions, additionalBodyElem) {
    const body = new XmlBuilder('1.0', '', 'ocs').build(ocs => {
      ocs.appendElement('meta', '', (meta) => {
        ocsMeta(meta, 'ok', '100')
      }).appendElement('data', '', data => {
        data.appendElement('element', '', element => {
          const node = shareResponseOcsData(element, 3, 17, permissions, testFolder)
          if (additionalBodyElem) {
            for (const prop in additionalBodyElem) {
              node.appendElement(prop, '', additionalBodyElem[prop])
            }
          }
          node.appendElement('name', '', 'Öffentlicher Link')
        })
      })
    })
    return provider.uponReceiving('a GET request for a public link share' + name)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/\\d+$',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares/9'
        ),
        headers: validAuthHeaders
      }).willRespondWith({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          ...applicationXmlResponseHeaders
        },
        body
      })
  }

  const aGETRequestForExistingShareWithId = (provider, fileid) => {
    return provider
      .uponReceiving('a GET request for an existent share with id ' + fileid)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/' + fileid + '$',
          '/ocs/v1.php/apps/files_sharing/api/v1/shares/' + fileid
        ),
        headers: validAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', data => {
            data.appendElement('element', '', element => {
              shareResponseOcsData(element, 0, fileid, 19, fileid)
            })
          })
        })
      })
  }

  describe('Currently testing folder sharing,', function () {
    // needs to be double checked ...
    describe('updating share permissions,', function () {
      it('confirms not changed permissions', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await aGetRequestForPublicLinkShare(provider, 'to confirm the permissions is not changed', 1, '')

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.getShare(testFolderShareID).then(share => {
            // permissions would still be read only as the share is public
            expect(share.getPermissions()).toEqual(1)
          }).catch(error => {
            expect(error).toBe(null)
          })
        })
      })
    })

    // needs to be double checked
    describe('making publicUpload true,', function () {
      it('confirms publicUpload true', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await aGetRequestForPublicLinkShare(provider, 'after making publicupload true', 15, '')

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.getShare(testFolderShareID).then(share => {
            expect(share.getPermissions() & OCS_PERMISSION_CREATE).toBeGreaterThan(0)
            expect(share.getPermissions() & OCS_PERMISSION_UPDATE).toBeGreaterThan(0)
          }).catch(error => {
            expect(error).toBe(null)
          })
        })
      })
    })

    // needs to be double checked
    describe('adding password,', function () {
      const additionalBodyElement = {
        share_with: '***redacted***',
        share_with_displayname: '***redacted***'
      }
      it('confirms added password', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await aGetRequestForPublicLinkShare(provider, 'after password is added', 1, additionalBodyElement)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.getShare(testFolderShareID).then(async share => {
            expect(typeof (share.getShareWith())).toEqual('string')
            expect(typeof (share.getShareWithDisplayName())).toEqual('string')
          }).catch(error => {
            expect(error).toBe(null)
          })
        })
      })
    })
  })

  describe('Currently testing file sharing,', function () {
    describe('sharedFilesByLink,', function () {
      describe('checking the shared files,', function () {
        it('checking method : isShared with shared file', async function () {
          const provider = createProvider()
          await capabilitiesGETRequestValidAuth(provider)
          await GETRequestToCloudUserEndpoint(provider)
          for (let i = 0; i < testFiles.length; i++) {
            await aGetRequestForAShareWithShareName(provider, 'public link share for isShared', 3, testFiles[i])
          }

          await provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()

            for (let i = 0; i < testFiles.length; i++) {
              await oc.shares.isShared(testFiles[i]).then(status => {
                expect(status).toEqual(true)
              }).catch(error => {
                expect(error).toBe(null)
              })
            }
          })
        })

        it('checking method : getShares for shared file', async function () {
          const allIDs = []
          for (const file in sharedFiles) {
            allIDs.push(sharedFiles[file])
          }

          const provider = createProvider()
          await capabilitiesGETRequestValidAuth(provider)
          await GETRequestToCloudUserEndpoint(provider)
          for (let i = 0; i < testFiles.length; i++) {
            await aGetRequestForAShareWithShareName(provider, 'public link share for getShares', 3, testFiles[i])
          }
          return provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()
            for (let i = 0; i < testFiles.length; i++) {
              await oc.shares.getShares(testFiles[i]).then(shares => {
                expect(shares.constructor).toBe(Array)
                let flag = 0
                for (let i = 0; i < shares.length; i++) {
                  const share = shares[i]
                  if (allIDs.indexOf(share.getId()) > -1) {
                    flag = 1
                  }
                }
                expect(flag).toEqual(1)
              }).catch(error => {
                expect(error).toBe(null)
              })
            }
          })
        })
      })

      it('checking method : getShare with existent share', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        for (let i = 0; i < config.testFiles.length; i++) {
          await aGETRequestForExistingShareWithId(provider, config.testFilesId[i])
        }
        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          for (const file in sharedFiles) {
            await oc.shares.getShare(sharedFiles[file]).then(share => {
              expect(typeof (share)).toBe('object')
              expect(Object.values(sharedFiles).indexOf(share.getId())).toBeGreaterThan(-1)
            }).catch(error => {
              expect(error).toBe(null)
            })
          }
        })
      })
    })

    describe('sharedFilesWithUser,', function () {
      describe('updating permissions', function () {
        it('confirms updated permissions', async function () {
          const maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE

          const provider = createProvider()
          await capabilitiesGETRequestValidAuth(provider)
          await GETRequestToCloudUserEndpoint(provider)
          await aGetRequestForPublicLinkShare(provider, 'after confirming updated permission', maxPerms, '')
          return provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()
            for (const file in sharedFiles) {
              await oc.shares.getShare(sharedFiles[file]).then(share => {
                expect(share.getPermissions()).toEqual(maxPerms)
              }).catch(error => {
                expect(error).toBe(null)
              })
            }
          })
        })
      })

      describe('checking method :', function () {
        it('isShared with shared file', async function () {
          const provider = createProvider()
          await capabilitiesGETRequestValidAuth(provider)
          await GETRequestToCloudUserEndpoint(provider)
          for (const file of testFiles) {
            await aGetRequestForAShareWithShareName(provider, 'user share ', 0, file)
          }
          return provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()
            for (const file in sharedFiles) {
              await oc.shares.isShared(file).then(status => {
                expect(status).toEqual(true)
              }).catch(error => {
                expect(error).toBe(null)
              })
            }
          })
        })

        it('getShare with existent share', async function () {
          const provider = createProvider()
          await capabilitiesGETRequestValidAuth(provider)
          await GETRequestToCloudUserEndpoint(provider)

          await aGetRequestForPublicLinkShare(provider, 'to confirm the share', OCS_PERMISSION_READ, '')
          return provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()
            for (const file in sharedFiles) {
              await oc.shares.getShare(sharedFiles[file]).then(share => {
                expect(typeof (share)).toBe('object')
                expect(share.getId()).toBeGreaterThan(-1)
              }).catch(error => {
                expect(error).toBe(null)
              })
            }
          })
        })

        it('getShares for shared file', async function () {
          const allIDs = []

          for (var file in sharedFiles) {
            allIDs.push(sharedFiles[file])
          }
          const provider = createProvider()
          await capabilitiesGETRequestValidAuth(provider)
          await GETRequestToCloudUserEndpoint(provider)
          for (let i = 0; i < testFiles.length; i++) {
            await aGetRequestForAShareWithShareName(provider, 'public link share: getShares for shared file', 3, testFiles[i])
          }
          return provider.executeTest(async () => {
            const oc = createOwncloud()
            await oc.login()
            for (file in sharedFiles) {
              await oc.shares.getShares(file).then(shares => {
                expect(shares.constructor).toBe(Array)
                let flag = 0
                for (let i = 0; i < shares.length; i++) {
                  const share = shares[i]
                  if (allIDs.indexOf(share.getId()) > -1) {
                    flag = 1
                  }
                }
                expect(flag).toEqual(1)
              }).catch(error => {
                expect(error).toBe(null)
              })
            }
          })
        })
      })
    })

    describe('sharedFilesWithGroup,', function () {
      it('checking method : isShared with shared file', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        for (const file of config.testFiles) {
          await aGetRequestForAShareWithShareName(provider, 'group share ', 1, file)
        }
        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return Promise.all(Object.keys(sharedFiles).map(key => {
            return oc.shares.isShared(key).then(status => {
              expect(status).toEqual(true)
            }).catch(error => {
              expect(error).toBe(null)
            })
          }))
        })
      })

      it('checking method : getShare with existent share', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        for (let i = 0; i < config.testFiles.length; i++) {
          await aGETRequestForExistingShareWithId(provider, config.testFilesId[i])
        }

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          for (const file in sharedFiles) {
            await oc.shares.getShare(sharedFiles[file]).then(share => {
              expect(typeof (share)).toBe('object')
              expect(share.getId()).toBeGreaterThan(-1)
            }).catch(error => {
              expect(error).toBe(null)
            })
          }
        })
      })

      it('checking method : getShares for shared file', async function () {
        const allIDs = []
        for (var file in sharedFiles) {
          allIDs.push(sharedFiles[file])
        }

        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        for (let i = 0; i < testFiles.length; i++) {
          await aGetRequestForAShareWithShareName(provider, 'public link share: getShares shared file', 3, testFiles[i])
        }

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          for (file in sharedFiles) {
            await oc.shares.getShares(file).then(shares => {
              expect(shares.constructor).toBe(Array)
              let flag = 0
              for (let i = 0; i < shares.length; i++) {
                const share = shares[i]
                if (allIDs.indexOf(share.getId()) > -1) {
                  flag = 1
                }
              }
              expect(flag).toEqual(1)
            }).catch(error => {
              expect(error).toBe(null)
            })
          }
        })
      })
    })

    describe('checking method: ', function () {
      function linkSharePOSTNonExistentFile (provider) {
        return provider.uponReceiving('a link share POST request with a non-existent file')
          .withRequest({
            method: 'POST',
            path: MatchersV3.regex(
              '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
              '/ocs/v1.php/apps/files_sharing/api/v1/shares'
            ),
            headers: validAuthHeaders
          // TODO: uncomment this line once the issue is fixed
          // https://github.com/pact-foundation/pact-js/issues/577
          // body: 'shareType=3' + '&path=%2F' + config.nonExistentFile + '&password=' + config.testUserPassword
          }).willRespondWith({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': accessControlAllowHeaders,
              'Access-Control-Allow-Methods': accessControlAllowMethods,
              ...applicationXmlResponseHeaders
            },
            body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
              ocs.appendElement('meta', '', (meta) => {
                ocsMeta(meta, 'failure', 404, 'Wrong path, file/folder doesn\'t exist')
              }).appendElement('data', '', '')
            })
          })
      }
      function groupSharePOSTNonExistentFile (provider) {
        return provider.uponReceiving('a group share POST request with valid auth but non-existent file')
          .withRequest({
            method: 'POST',
            path: MatchersV3.regex(
              '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
              '/ocs/v1.php/apps/files_sharing/api/v1/shares'
            ),
            headers: validAuthHeaders
          // TODO: uncomment this line once the issue is fixed
          // https://github.com/pact-foundation/pact-js/issues/577
          // body: 'shareType=1&shareWith=' + config.testGroup + '&path=%2F' + config.nonExistentFile + '&permissions=19'
          }).willRespondWith({
            status: 200,
            headers: applicationXmlResponseHeaders,
            body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
              ocs.appendElement('meta', '', (meta) => {
                ocsMeta(meta, 'failure', 404, 'Wrong path, file/folder doesn\'t exist')
              }).appendElement('data', '', '')
            })
          })
      }
      function shareGETNonExistentFile (provider, name = '') {
        return provider.uponReceiving('a GET request for a share with non-existent file ' + name)
          .withRequest({
            method: 'GET',
            path: MatchersV3.regex(
              '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
              '/ocs/v1.php/apps/files_sharing/api/v1/shares'
            ),
            query: { path: '/' + config.nonExistentFile },
            headers: validAuthHeaders
          }).willRespondWith({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': accessControlAllowHeaders,
              'Access-Control-Allow-Methods': accessControlAllowMethods,
              ...applicationXmlResponseHeaders
            },
            body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
              ocs.appendElement('meta', '', (meta) => {
                ocsMeta(meta, 'failure', 404, 'Wrong path, file/folder doesn\'t exist')
              }).appendElement('data', '', '')
            })
          })
      }
      function shareGETExistingNonSharedFile (provider, name) {
        return provider.uponReceiving('a GET request for an existent but non-shared file ' + name)
          .withRequest({
            method: 'GET',
            path: MatchersV3.regex(
              '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
              '/ocs/v1.php/apps/files_sharing/api/v1/shares'
            ),
            query: { path: '/newFileCreated123' }, // 'path=%2FnewFileCreated123',
            headers: validAuthHeaders
          })
          .willRespondWith({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': accessControlAllowHeaders,
              'Access-Control-Allow-Methods': accessControlAllowMethods,
              ...applicationXmlResponseHeaders
            },
            body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
              ocs.appendElement('meta', '', (meta) => {
                ocsMeta(meta, 'OK', 100)
              }).appendElement('data', '', '')
            })
          })
      }
      function shareGetNonExistentShare (provider) {
        return provider.uponReceiving('a GET request for a non-existent share')
          .withRequest({
            method: 'GET',
            path: MatchersV3.regex(
              '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/-1$',
              '/ocs/v1.php/apps/files_sharing/api/v1/shares/-1'
            ),
            headers: validAuthHeaders
          })
          .willRespondWith({
            status: 200,
            headers: xmlResponseHeaders,
            body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
              ocs.appendElement('meta', '', (meta) => {
                ocsMeta(meta, 'failure', 404, 'Wrong share ID, share doesn\'t exist')
              }).appendElement('data', '', '')
            })
          })
      }
      function putFileWithExmptyContent (provider) {
        return provider.uponReceiving('Put file contents as empty content in files specified')
          .withRequest({
            method: 'PUT',
            path: MatchersV3.regex(
              '.*\\/remote\\.php\\/webdav\\/newFileCreated123$',
              '/remote.php/webdav/newFileCreated123'
            ),
            headers: validAuthHeaders
          })
          .willRespondWith({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': origin
            }
          })
      }

      function sharePOSTRequestWithExpirationDateSet (provider, file) {
        return provider.uponReceiving('a user share POST request with valid auth and expiration date set to path ' + file)
          .withRequest({
            method: 'POST',
            path: MatchersV3.regex(
              '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
              '/ocs/v1.php/apps/files_sharing/api/v1/shares'
            ),
            headers: validAuthHeaders
            // TODO: uncomment this line once the issue is fixed
            // https://github.com/pact-foundation/pact-js/issues/577
            // body: 'shareType=0&shareWith=' + config.testUser + '&path=' + config.testFilesPath[i] + '&expireDate=' + config.expirationDate
          })
          .willRespondWith({
            status: 200,
            headers: applicationXmlResponseHeaders,
            body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
              ocs.appendElement('meta', '', (meta) => {
                ocsMeta(meta, 'ok', 100)
              }).appendElement('data', '', data => {
                shareResponseOcsData(data, 0, config.testFilesId[testFiles.indexOf(file)], 19, file)
                  .appendElement('expiration', '', config.expirationDate + ' 00:00:00')
              })
            })
          })
      }

      function updateDeleteShareNonExistent (provider, method) {
        return provider
          .uponReceiving('a ' + method + ' request to update/delete a non-existent share')
          .withRequest({
            method,
            path: MatchersV3.regex(
              '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/-1$',
              '/ocs/v1.php/apps/files_sharing/api/v1/shares/-1'
            ),
            headers: validAuthHeaders
          })
          .willRespondWith({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': origin,
              ...applicationXmlResponseHeaders
            },
            body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
              ocs.appendElement('meta', '', (meta) => {
                ocsMeta(meta, 'failure', 404, 'Wrong share ID, share doesn\'t exist')
              }).appendElement('data', '', '')
            })
          })
      }

      it('shareFileWithLink with non-existent file', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await linkSharePOSTNonExistentFile(provider)
        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.shareFileWithLink(nonExistentFile, { password: testUserPassword }).then(status => {
            expect(status).toBe(null)
          }).catch(error => {
            expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
          })
        })
      })

      it('shareFileWithGroup with non existent file', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await groupSharePOSTNonExistentFile(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.shareFileWithGroup(nonExistentFile, testGroup, { permissions: 19 }).then(share => {
            expect(share).toBe(null)
          }).catch(error => {
            expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
          })
        })
      })

      it('isShared with non existent file', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await shareGETNonExistentFile(provider, 'for testing isShared')

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.isShared(nonExistentFile).then(status => {
            expect(status).toBe(null)
          }).catch(error => {
            expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
          })
        })
      })

      it('isShared with existent but non shared file', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await putFileWithExmptyContent(provider)
        await shareGETExistingNonSharedFile(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          const suffix = '123'
          return oc.files.putFileContents('newFileCreated' + suffix).then(status => {
            expect(typeof status).toBe('object')
            return oc.shares.isShared('newFileCreated' + suffix)
          }).then(isShared => {
            expect(isShared).toEqual(false)
          }).catch(error => {
            expect(error).toBe(null)
          })
        })
      })

      it('getShare with non existent share', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await shareGetNonExistentShare(provider)

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.getShare(-1).then(share => {
            expect(share).toBe(null)
          }).catch(error => {
            if (error.slice(-1) === '.') {
              error = error.slice(0, -1)
            }
            expect(error.toLowerCase()).toEqual('wrong share id, share doesn\'t exist')
          })
        })
      })

      it('getShares for non existent file', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await shareGETNonExistentFile(provider, 'for testing getShares')

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.getShares(nonExistentFile).then(shares => {
            expect(shares).toBe(null)
          }).catch(error => {
            expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
          })
        })
      })

      it('getShares for existent but non shared file', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await putFileWithExmptyContent(provider)
        await shareGETExistingNonSharedFile(provider, 'testing getShares')

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          const suffix = '123'
          return oc.files.putFileContents('newFileCreated' + suffix).then(status => {
            expect(typeof status).toBe('object')
            return oc.shares.getShares('newFileCreated' + suffix)
          }).then(shares => {
            expect(shares.constructor).toEqual(Array)
            expect(shares.length).toEqual(0)
          }).catch(error => {
            expect(error).toBe(null)
          })
        })
      })

      it('updateShare for non existent share', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await updateDeleteShareNonExistent(provider, 'PUT')

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.updateShare(-1).then(status => {
            expect(status).toBe(null)
          }).catch(error => {
            if (error.slice(-1) === '.') {
              error = error.slice(0, -1)
            }
            expect(error.toLowerCase()).toBe('wrong share id, share doesn\'t exist')
          })
        })
      })

      it('deleteShare with non existent share', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)
        await updateDeleteShareNonExistent(provider, 'DELETE')

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()
          return oc.shares.deleteShare(-1).then(status => {
            expect(status).toBe(true)
          }).catch(error => {
            if (error.slice(-1) === '.') {
              error = error.slice(0, -1)
            }
            expect(error.toLowerCase()).toBe('wrong share id, share doesn\'t exist')
          })
        })
      })

      it('should share a file with another user when expiration date is set', async function () {
        const provider = createProvider()
        await capabilitiesGETRequestValidAuth(provider)
        await GETRequestToCloudUserEndpoint(provider)

        // TODO: uncomment this line once the issue is fixed
        // https://github.com/pact-foundation/pact-js/issues/577
        // await Promise.all(testFiles.map(file => sharePOSTRequestWithExpirationDateSet(provider, file)))

        await sharePOSTRequestWithExpirationDateSet(provider, testFiles[0])

        return provider.executeTest(async () => {
          const oc = createOwncloud()
          await oc.login()

          await Promise.all(testFiles.map(file => {
            return oc.shares.shareFileWithUser(
              file,
              testUser,
              { expirationDate: expirationDate }
            ).then(share => {
              expect(share).not.toBe(null)
              expect(typeof share).toBe('object')
              expect(typeof share.getId()).toBe('number')
              expect(typeof share.getExpiration()).toBe('number')
            }).catch(error => {
              fail(error)
            })
          }))
        })
      })
    })
  })
})
