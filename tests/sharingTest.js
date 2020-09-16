describe('Main: Currently testing file/folder sharing,', function () {
  // CURRENT TIME
  const currentDate = new Date()
  const randomID = Math.random().toString(36).substr(2, 9)
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const testUserPassword = 'password'
  const testContent = 'testContent'
  const testUser = 'testUser' + randomID
  const testGroup = 'testGroup' + randomID
  const testFolder = '/testFolder' + randomID
  const nonExistentFile = 'nonExistentFile' + randomID
  let expirationDate = addDays(currentDate, 7).toISOString()

  // Remove time from expirationDate
  expirationDate = expirationDate.substring(0, expirationDate.indexOf('T'))

  const testFiles = [
    '/文件' + randomID + '.txt',
    '/test' + randomID + '.txt',
    '/test space and + and #' + randomID + '.txt'
  ]

  // CREATED SHARES
  let sharedFilesWithUser = {}
  let sharedFilesByLink = {}
  let sharedFilesWithGroup = {}
  let testFolderShareID = null
  const allShareIDs = []

  // CONSTANTS FROM lib/public/constants.php
  const OCS_PERMISSION_READ = 1
  const OCS_PERMISSION_UPDATE = 2
  const OCS_PERMISSION_CREATE = 4
  const OCS_PERMISSION_SHARE = 16

  // Helpers
  /**
   * Adds specified number of dates to the date
   * @param   {object} date Date to which the days are supposed to be added
   * @param   {number} days Number of days to be added
   * @returns {object}      Returns the date with added days
   */
  function addDays (date, days) {
    const newDate = new Date(Number(date))
    newDate.setDate(date.getDate() + days)

    return newDate
  }

  describe('Currently testing folder sharing,', function () {
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
        oc.files.createFolder(testFolder).then(status => {
          expect(status).toBe(true)
          done()
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
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
      oc.logout()
      oc = null
    })

    describe('sharedFolder,', function () {
      beforeEach(function (done) {
        const testLinkName = 'Öffentlicher Link'
        oc.shares.shareFileWithLink(testFolder, { name: testLinkName }).then(share => {
          expect(typeof (share)).toBe('object')
          expect(share.getName()).toBe(testLinkName)
          expect(share.getPath()).toBe(testFolder)
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
          oc.shares.updateShare(testFolderShareID, { permissions: 31 }) // max-permissions
            .then(updatedShare => {
              expect(updatedShare.getId()).toBe(testFolderShareID)
              expect(updatedShare.getPermissions()).toBe(31)
              done()
            }).catch(error => {
              let check = 'can\'t change permissions for public share links'
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
          oc.shares.updateShare(testFolderShareID, { publicUpload: true }).then(updatedShare => {
            expect(updatedShare.getId()).toBe(testFolderShareID)
            expect(updatedShare.getPermissions() & OCS_PERMISSION_CREATE).toBeGreaterThan(0)
            expect(updatedShare.getPermissions() & OCS_PERMISSION_UPDATE).toBeGreaterThan(0)
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
          oc.shares.updateShare(testFolderShareID, { password: 'testPassword' }).then(updatedShare => {
            expect(updatedShare.getId()).toBe(testFolderShareID)
            expect(typeof (updatedShare.getShareWith())).toEqual('string')
            expect(typeof (updatedShare.getShareWithDisplayName())).toEqual('string')
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
        // CREATING TEST USER
        oc.users.createUser(testUser, testUserPassword).then(status => {
          expect(status).toBe(true)
          // CREATING TEST GROUP
          return oc.groups.createGroup(testGroup)
        }).then(status => {
          expect(status).toBe(true)
          let count = 0
          for (let i = 0; i < testFiles.length; i++) {
            // CREATING TEST FILES
            oc.files.putFileContents(testFiles[i], testContent).then(status => {
              expect(typeof status).toBe('object')
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
    })

    afterEach(function (done) {
      oc.users.deleteUser(testUser).then(status => {
        expect(status).toBe(true)
        return oc.groups.deleteGroup(testGroup)
      }).then(status2 => {
        expect(status2).toBe(true)

        let count = 0
        for (let i = 0; i < testFiles.length; i++) {
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
        let count = 0
        for (let i = 0; i < testFiles.length; i++) {
          oc.shares.shareFileWithLink(testFiles[i]).then(share => {
            expect(share).not.toBe(null)
            expect(typeof (share)).toBe('object')
            expect(testFiles.indexOf(share.getPath())).toBeGreaterThan(-1)
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
        let count = 0
        const numShares = Object.keys(sharedFilesByLink).length

        for (const file in sharedFilesByLink) {
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

        it('checking method : getShare with existent share', function (done) {
          let count = 0

          for (const file in sharedFilesByLink) {
            oc.shares.getShare(sharedFilesByLink[file]).then(share => {
              expect(typeof (share)).toBe('object')
              expect(Object.prototype.hasOwnProperty.call(sharedFilesWithUser, share.getId())).toBeGreaterThan(-1)
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
          let count = 0
          const allIDs = []
          for (const file in sharedFilesByLink) {
            allIDs.push(sharedFilesByLink[file])
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
    })

    describe('sharedFilesWithUser,', function () {
      beforeEach(function (done) {
        let count = 0

        for (let i = 0; i < testFiles.length; i++) {
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
        let count = 0

        for (const file in sharedFilesWithUser) {
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
          const maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE
          let count = 0

          for (const file in sharedFilesWithUser) {
            oc.shares.updateShare(sharedFilesWithUser[file], { permissions: maxPerms }).then(updatedShare => {
              expect(updatedShare.getPermissions()).toBe(maxPerms)
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
          const maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE
          let count = 0

          for (const file in sharedFilesWithUser) {
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
        let count = 0

        for (const file in sharedFilesWithUser) {
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
        let count = 0

        for (const file in sharedFilesWithUser) {
          oc.shares.getShare(sharedFilesWithUser[file]).then(share => {
            expect(typeof (share)).toBe('object')
            expect(Object.prototype.hasOwnProperty.call(sharedFilesWithUser, share.getId())).toBeGreaterThan(-1)
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
        let count = 0
        const allIDs = []
        for (var file in sharedFilesWithUser) {
          allIDs.push(sharedFilesWithUser[file])
        }

        for (file in sharedFilesWithUser) {
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
        let count = 0

        for (let i = 0; i < testFiles.length; i++) {
          oc.shares.shareFileWithGroup(testFiles[i], testGroup, { permissions: 19 }).then(share => {
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
        let count = 0

        for (const file in sharedFilesWithGroup) {
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
        let count = 0

        for (const file in sharedFilesWithGroup) {
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
        let count = 0

        for (const file in sharedFilesWithGroup) {
          oc.shares.getShare(sharedFilesWithGroup[file]).then(share => {
            expect(typeof (share)).toBe('object')
            expect(Object.prototype.hasOwnProperty.call(sharedFilesWithGroup, share.getId())).toBeGreaterThan(-1)
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
        let count = 0
        const allIDs = []
        for (var file in sharedFilesWithGroup) {
          allIDs.push(sharedFilesWithGroup[file])
        }

        for (file in sharedFilesWithGroup) {
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
      oc.shares.shareFileWithLink(nonExistentFile, { password: 'testPassword' }).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
        done()
      })
    })

    it('checking method : shareFileWithGroup with non existent file', function (done) {
      oc.shares.shareFileWithGroup(nonExistentFile, testGroup, { permissions: 19 }).then(share => {
        expect(share).toBe(null)
        done()
      }).catch(error => {
        expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
        done()
      })
    })

    it('checking method : isShared with non existent file', function (done) {
      oc.shares.isShared(nonExistentFile).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
        done()
      })
    })

    it('checking method : isShared with existent but non shared file', function (done) {
      const suffix = Math.random().toString(36).substr(2, 9)
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
      oc.shares.getShares(nonExistentFile).then(shares => {
        expect(shares).toBe(null)
        done()
      }).catch(error => {
        expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist')
        done()
      })
    })

    it('checking method : getShares for existent but non shared file', function (done) {
      const suffix = Math.random().toString(36).substr(2, 9)
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
