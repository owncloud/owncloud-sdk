describe('Main: Currently testing file/folder sharing,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var OwnCloud = require('../owncloud/owncloud')
  var config = require('../owncloud/test/config.json')
  var utf8 = require('utf8')

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testUserPassword = 'password'
  var testContent = 'testContent'
  var testUser = 'testUser' + timeRightNow
  var testGroup = 'testGroup' + timeRightNow
  var testFolder = '/testFolder' + timeRightNow
  var nonExistingFile = 'nonExistingFile' + timeRightNow

  var testFiles = [
    '/文件' + timeRightNow + '.txt',
    '/test' + timeRightNow + '.txt',
    '/test space and + and #' + timeRightNow + '.txt'
  ]

  // CREATED SHARES
  var sharedFilesWithUser = {}
  var sharedFilesByLink = {}
  var sharedFilesWithGroup = {}
  var testFolderShareID = null
  var allShareIDs = []

  // CONSTANTS FROM lib/public/constants.php
  var OCS_PERMISSION_READ = 1
  var OCS_PERMISSION_UPDATE = 2
  var OCS_PERMISSION_CREATE = 4
  var OCS_PERMISSION_SHARE = 16

  describe('Currently testing folder sharing,', function () {
    beforeEach(function (done) {
      oc = new OwnCloud(config.owncloudURL)
      oc.login(config.username, config.password)

      oc.files.createFolder(testFolder).then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    afterEach(function (done) {
      oc.files.delete(testFolder).then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    describe('sharedFolder,', function () {
      beforeEach(function (done) {
        oc.shares.shareFileWithLink(testFolder).then(share => {
          expect(typeof (share)).toBe('object')
          testFolderShareID = share.getId()
          allShareIDs.push(testFolderShareID)
          done()
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
      })

      afterEach(function (done) {
        oc.shares.deleteShare(testFolderShareID).then(status => {
          expect(status).toBe(true)
          done()
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
      })

      // needs to be double checked ...
      describe('updating share permissions,', function () {
        beforeEach(function (done) {
          oc.shares.updateShare(testFolderShareID, { perms: 31 }) // max-permissions
            .then(status => {
              expect(status).toBe(null)
              done()
            }).catch(error => {
              var check = 'can\'t change permissions for public share links'
              if (error === 'can\'t change permission for public link share') {
                check = 'can\'t change permission for public link share'
              }
              expect(error.toLowerCase()).toBe(check)
              done()
            })
        })

        it('confirms not changed permissions', function (done) {
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
        beforeEach(function (done) {
          oc.shares.updateShare(testFolderShareID, { publicUpload: true }).then(data => {
            expect(data).toBe(true)
            done()
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        })

        it('confirms publicUpload true', function (done) {
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
        beforeEach(function (done) {
          oc.shares.updateShare(testFolderShareID, { password: 'testPassword' }).then(status => {
            expect(status).toEqual(true)
            done()
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        })

        it('confirms added password', function (done) {
          oc.shares.getShare(testFolderShareID).then(share => {
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
    beforeEach(function (done) {
      oc = new OwnCloud(config.owncloudURL)
      oc.login(config.username, config.password)

      // CREATING TEST USER
      oc.users.createUser(testUser, testUserPassword).then(status => {
        expect(status).toBe(true)
        // CREATING TEST GROUP
        return oc.groups.createGroup(testGroup)
      }).then(status => {
        expect(status).toBe(true)
        var count = 0
        for (var i = 0; i < testFiles.length; i++) {
          // CREATING TEST FILES
          oc.files.putFileContents(testFiles[i], testContent).then(status => {
            expect(status).toBe(true)
            count++
            if (count === testFiles.length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    afterEach(function (done) {
      oc.users.deleteUser(testUser).then(status => {
        expect(status).toBe(true)
        return oc.groups.deleteGroup(testGroup)
      }).then(status2 => {
        expect(status2).toBe(true)

        var count = 0
        for (var i = 0; i < testFiles.length; i++) {
          // DELETING TEST FILES
          oc.files.delete(testFiles[i]).then(status => {
            expect(status).toBe(true)
            count++
            if (count === testFiles.length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    describe('sharedFilesByLink,', function () {
      beforeEach(function (done) {
        var count = 0
        for (var i = 0; i < testFiles.length; i++) {
          oc.shares.shareFileWithLink(testFiles[i]).then(share => {
            expect(share).not.toBe(null)
            expect(typeof (share)).toBe('object')
            expect(testFiles.indexOf(utf8.decode(share.getPath()))).toBeGreaterThan(-1)
            expect(typeof (share.getId())).toBe('number')
            expect(typeof (share.getLink())).toBe('string')
            expect(typeof (share.getToken())).toBe('string')
            sharedFilesByLink[share.getPath()] = share.getId()
            allShareIDs.push(share.getId())
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

      afterEach(function (done) {
        var count = 0
        var numShares = Object.keys(sharedFilesByLink).length

        for (var file in sharedFilesByLink) {
          oc.shares.deleteShare(sharedFilesByLink[file]).then(status => {
            expect(status).toBe(true)
            count++
            if (count === numShares) {
              sharedFilesByLink = {}
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      describe('checking the shared files,', function () {
        it('checking method : isShared with shared file', function (done) {
          var count = 0

          for (var i = 0; i < testFiles.length; i++) {
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

        it('checking method : getShare with existent share', function (done) {
          var count = 0

          for (var file in sharedFilesByLink) {
            oc.shares.getShare(sharedFilesByLink[file]).then(share => {
              expect(typeof (share)).toBe('object')
              expect(sharedFilesWithUser.hasOwnProperty(share.getId())).toBeGreaterThan(-1)
              count++
              if (count === Object.keys(sharedFilesByLink).length) {
                done()
              }
            }).catch(error => {
              expect(error).toBe(null)
              done()
            })
          }
        })

        it('checking method : getShares for shared file', function (done) {
          var count = 0
          var allIDs = []
          for (var file in sharedFilesByLink) {
            allIDs.push(sharedFilesByLink[file])
          }

          for (var i = 0; i < testFiles.length; i++) {
            oc.shares.getShares(testFiles[i]).then(shares => {
              expect(shares.constructor).toBe(Array)
              var flag = 0
              for (var i = 0; i < shares.length; i++) {
                var share = shares[i]
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
    })

    describe('sharedFilesWithUser,', function () {
      beforeEach(function (done) {
        var count = 0

        for (var i = 0; i < testFiles.length; i++) {
          oc.shares.shareFileWithUser(testFiles[i], testUser).then(share => {
            expect(share).not.toBe(null)
            expect(typeof (share)).toBe('object')
            expect(typeof (share.getId())).toBe('number')
            sharedFilesWithUser[share.getPath()] = share.getId()
            allShareIDs.push(share.getId())
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

      afterEach(function (done) {
        var count = 0

        for (var file in sharedFilesWithUser) {
          oc.shares.deleteShare(sharedFilesWithUser[file]).then(status => {
            expect(status).toBe(true)
            count++
            if (count === testFiles.length) {
              sharedFilesWithUser = {}
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      describe('updating permissions', function () {
        beforeEach(function (done) {
          var maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE
          var count = 0

          for (var file in sharedFilesWithUser) {
            oc.shares.updateShare(sharedFilesWithUser[file], { perms: maxPerms }).then(status => {
              expect(status).toEqual(true)
              count++
              if (count === Object.keys(sharedFilesWithUser).length) {
                done()
              }
            }).catch(error => {
              expect(error).toBe(null)
              done()
            })
          }
        })

        it('confirms updated permissions', function (done) {
          var maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE
          var count = 0

          for (var file in sharedFilesWithUser) {
            oc.shares.getShare(sharedFilesWithUser[file]).then(share => {
              expect(share.getPermissions()).toEqual(maxPerms)
              count++
              if (count === Object.keys(sharedFilesWithUser).length) {
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
        var count = 0

        for (var file in sharedFilesWithUser) {
          oc.shares.isShared(file).then(status => {
            expect(status).toEqual(true)
            count++
            if (count === Object.keys(sharedFilesWithUser).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      it('checking method : getShare with existent share', function (done) {
        var count = 0

        for (var file in sharedFilesWithUser) {
          oc.shares.getShare(sharedFilesWithUser[file]).then(share => {
            expect(typeof (share)).toBe('object')
            expect(sharedFilesWithUser.hasOwnProperty(share.getId())).toBeGreaterThan(-1)
            count++
            if (count === Object.keys(sharedFilesWithUser).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      it('checking method : getShares for shared file', function (done) {
        var count = 0
        var allIDs = []
        for (var file in sharedFilesWithUser) {
          allIDs.push(sharedFilesWithUser[file])
        }

        for (file in sharedFilesWithUser) {
          oc.shares.getShares(file).then(shares => {
            expect(shares.constructor).toBe(Array)
            var flag = 0
            for (var i = 0; i < shares.length; i++) {
              var share = shares[i]
              if (allIDs.indexOf(share.getId()) > -1) {
                flag = 1
              }
            }
            expect(flag).toEqual(1)
            count++
            if (count === Object.keys(sharedFilesWithUser).length) {
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
        var count = 0

        for (var i = 0; i < testFiles.length; i++) {
          oc.shares.shareFileWithGroup(testFiles[i], testGroup, { perms: 19 }).then(share => {
            expect(typeof (share)).toEqual('object')
            expect(share.getPermissions()).toEqual(19)
            sharedFilesWithGroup[share.getPath()] = share.getId()
            allShareIDs.push(share.getId())
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

      afterEach(function (done) {
        var count = 0

        for (var file in sharedFilesWithGroup) {
          oc.shares.deleteShare(sharedFilesWithGroup[file]).then(status => {
            expect(status).toEqual(true)
            count++
            if (count === testFiles.length) {
              sharedFilesWithGroup = {}
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      it('checking method : isShared with shared file', function (done) {
        var count = 0

        for (var file in sharedFilesWithGroup) {
          oc.shares.isShared(file).then(status => {
            expect(status).toEqual(true)
            count++
            if (count === Object.keys(sharedFilesWithGroup).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      it('checking method : getShare with existent share', function (done) {
        var count = 0

        for (var file in sharedFilesWithGroup) {
          oc.shares.getShare(sharedFilesWithGroup[file]).then(share => {
            expect(typeof (share)).toBe('object')
            expect(sharedFilesWithGroup.hasOwnProperty(share.getId())).toBeGreaterThan(-1)
            count++
            if (count === Object.keys(sharedFilesWithGroup).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })

      it('checking method : getShares for shared file', function (done) {
        var count = 0
        var allIDs = []
        for (var file in sharedFilesWithGroup) {
          allIDs.push(sharedFilesWithGroup[file])
        }

        for (file in sharedFilesWithGroup) {
          oc.shares.getShares(file).then(shares => {
            expect(shares.constructor).toBe(Array)
            var flag = 0
            for (var i = 0; i < shares.length; i++) {
              var share = shares[i]
              if (allIDs.indexOf(share.getId()) > -1) {
                flag = 1
              }
            }
            expect(flag).toEqual(1)
            count++
            if (count === Object.keys(sharedFilesWithGroup).length) {
              done()
            }
          }).catch(error => {
            expect(error).toBe(null)
            done()
          })
        }
      })
    })

    it('checking method : shareFileWithLink with non-existent file', function (done) {
      oc.shares.shareFileWithLink(nonExistingFile, { password: 'testPassword' }).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
        done()
      })
    })

    it('checking method : shareFileWithGroup with non existent file', function (done) {
      oc.shares.shareFileWithGroup(nonExistingFile, testGroup, { perms: 19 }).then(share => {
        expect(share).toBe(null)
        done()
      }).catch(error => {
        expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
        done()
      })
    })

    it('checking method : isShared with non existent file', function (done) {
      oc.shares.isShared(nonExistingFile).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
        done()
      })
    })

    it('checking method : isShared with existent but non shared file', function (done) {
      oc.files.putFileContents('newFileCreated' + timeRightNow).then(status => {
        expect(status).toBe(true)
        return oc.shares.isShared('newFileCreated' + timeRightNow)
      }).then(isShared => {
        expect(isShared).toEqual(false)
        // DELETING THE NEWLY CREATED FILE
        return oc.files.delete('newFileCreated' + timeRightNow)
      }).then(status2 => {
        expect(status2).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method : getShare with non existent share', function (done) {
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

    it('checking method : getShares for non existent file', function (done) {
      oc.shares.getShares(nonExistingFile).then(shares => {
        expect(shares).toBe(null)
        done()
      }).catch(error => {
        expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
        done()
      })
    })

    it('checking method : getShares for existent but non shared file', function (done) {
      oc.files.putFileContents('newFileCreated' + timeRightNow).then(status => {
        expect(status).toBe(true)
        return oc.shares.getShares('newFileCreated' + timeRightNow)
      }).then(shares => {
        expect(shares.constructor).toEqual(Array)
        expect(shares.length).toEqual(0)
        // DELETING THE NEWLY CREATED FILE
        return oc.files.delete('newFileCreated' + timeRightNow)
      }).then(status2 => {
        expect(status2).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method : updateShare for non existent share', function (done) {
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

    it('checking method : deleteShare with non existent share', function (done) {
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
  })
})
