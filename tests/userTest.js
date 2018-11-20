describe('Main: Currently testing user management,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testUser = 'testUser' + timeRightNow
  var testUserPassword = 'password'
  var testGroup = 'testGroup' + timeRightNow
  var nonExistingUser = 'nonExistingUser' + timeRightNow
  var nonExistingGroup = 'nonExistingGroup' + timeRightNow

  beforeEach(function (done) {
    oc = new OwnCloud(config.owncloudURL)
    oc.login(config.username, config.password).then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      return oc.users.createUser(testUser, testUserPassword)
    }).then(status2 => {
      expect(status2).toBe(true)
      return oc.groups.createGroup(testGroup)
    }).then(status3 => {
      expect(status3).toBe(true)
      done()
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
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    }).then(() => {
      oc.logout()
      oc = null
    })
  })

  describe('added testUser to testGroup,', function () {
    beforeEach(function (done) {
      oc.users.addUserToGroup(testUser, testGroup).then(status => {
        expect(status).toBe(true)
        return oc.users.userIsInGroup(testUser, testGroup)
      }).then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    afterEach(function (done) {
      oc.users.removeUserFromGroup(testUser, testGroup).then(status => {
        expect(status).toBe(true)
        return oc.users.userIsInGroup(testUser, testGroup)
      }).then(status => {
        expect(status).toBe(false)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method : getUserGroups with an existent user', function (done) {
      oc.users.getUserGroups(testUser).then(data => {
        expect(typeof (data)).toEqual('object')
        expect(data.indexOf(testGroup)).toBeGreaterThan(-1)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method : userIsInGroup with an existent user, existent group', function (done) {
      oc.users.userIsInGroup(testUser, testGroup).then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })
  })

  describe('made testUser as testGroup subAdmin', function () {
    beforeEach(function (done) {
      oc.users.addUserToSubadminGroup(testUser, testGroup).then(status => {
        expect(status).toBe(true)
        return oc.users.userIsInSubadminGroup(testUser, testGroup)
      }).then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })

    it('checking method : getUserSubadminGroups with an existent user', function (done) {
      oc.users.getUserSubadminGroups(testUser).then(data => {
        expect(typeof (data)).toEqual('object')
        expect(data.indexOf(testGroup)).toBeGreaterThan(-1)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })
  })

  it('checking method : getUser on an existent user', function (done) {
    oc.users.getUser(config.username).then(data => {
      expect(typeof (data)).toEqual('object')
      expect(data.displayname).toEqual(config.username)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : getUser on a non existent user', function (done) {
    oc.users.getUser(nonExistingUser).then(user => {
      expect(user).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('The requested user could not be found')
      done()
    })
  })

  it('checking method : createUser', function (done) {
    oc.users.createUser('newUser' + timeRightNow, testUserPassword).then(data => {
      expect(data).toEqual(true)
      return oc.users.deleteUser('newUser' + timeRightNow)
    }).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : searchUsers', function (done) {
    oc.users.searchUsers('').then(data => {
      expect(typeof (data)).toEqual('object')
      expect(data.indexOf(config.username)).toBeGreaterThan(-1)
      expect(data.indexOf(testUser)).toBeGreaterThan(-1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : searchUsers with zero user results', function (done) {
    oc.users.searchUsers(nonExistingUser).then(data => {
      expect(typeof (data)).toEqual('object')
      expect(data.length).toEqual(0)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : userExists with existent user', function (done) {
    oc.users.userExists(config.username).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : userExists with non existent user', function (done) {
    oc.users.userExists(nonExistingUser).then(status => {
      expect(status).toBe(false)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : setUserAttribute of an existent user, allowed attribute', function (done) {
    oc.users.setUserAttribute(testUser, 'email', 'asd@a.com').then(data => {
      expect(data).toEqual(true)
      return oc.users.getUser(testUser)
    }).then(user => {
      expect(typeof (user)).toEqual('object')
      expect(user.email).toEqual('asd@a.com')
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : setUserAttribute of an existent user, not allowed attribute', function (done) {
    oc.users.setUserAttribute(testUser, 'email', 'äöüää_sfsdf+$%/)%&=')
      .then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        // FULL REQUEST RESPONSE RETURNED
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('102')
        done()
      })
  })

  it('checking method : setUserAttribute of a non existent user', function (done) {
    oc.users.setUserAttribute(nonExistingUser, 'email', 'asd@a.com').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(typeof (error)).toBe('object')
      expect(error.ocs.meta.statuscode).toEqual('997')
      done()
    })
  })

  it('checking method : addUserToGroup with existent user, non existent group', function (done) {
    oc.users.addUserToGroup(testUser, nonExistingGroup)
      .then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        // FULL RESPONSE IS RETURNED
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('102')
        done()
      })
  })

  it('checking method : addUserToGroup with non existent user, existent group', function (done) {
    oc.users.addUserToGroup(nonExistingUser, testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(typeof (error)).toBe('object')
      expect(error.ocs.meta.statuscode).toEqual('103')
      done()
    })
  })

  it('checking method : getUserGroups with a non existent user', function (done) {
    oc.users.getUserGroups(nonExistingUser).then(data => {
      expect(typeof (data)).toBe('object')
      expect(data.length).toEqual(0)
      done()
    }).catch(error => {
      expect(typeof (error)).toBe('object')
      expect(error.ocs.meta.statuscode).toEqual('998')
      done()
    })
  })

  it('checking method : userIsInGroup with an existent user but a group the user isn\'t part of', function (done) {
    oc.users.userIsInGroup(testUser, 'admin').then(status => {
      expect(status).toEqual(false)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : userIsInGroup with an existent user, non existent group', function (done) {
    oc.users.userIsInGroup(testUser, nonExistingGroup)
      .then(status => {
        expect(status).toEqual(false)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
  })

  it('checking method : userIsInGroup with a non existent user', function (done) {
    oc.users.userIsInGroup(nonExistingUser, testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(typeof (error)).toBe('object')
      expect(error.ocs.meta.statuscode).toEqual('998')
      done()
    })
  })

  it('checking method : getUser with an existent user', function (done) {
    oc.users.getUser(testUser).then(data => {
      expect(typeof (data)).toEqual('object')
      expect(data.displayname).toEqual(testUser)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : getUser with a non existent user', function (done) {
    oc.users.getUser(nonExistingUser).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toEqual('The requested user could not be found')
      done()
    })
  })

  it('checking method : removeUserFromGroup with existent user, non existent group', function (done) {
    oc.users.removeUserFromGroup(testUser, nonExistingGroup)
      .then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('102')
        done()
      })
  })

  it('checking method : removeUserFromGroup with non existent user, existent group', function (done) {
    oc.users.removeUserFromGroup(nonExistingGroup, testGroup)
      .then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('103')
        done()
      })
  })

  it('checking method : addUserToSubadminGroup with existent user, non existent group', function (done) {
    oc.users.addUserToSubadminGroup(testUser, nonExistingGroup)
      .then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error).toBe('Group:' + nonExistingGroup + ' does not exist')
        done()
      })
  })

  it('checking method : addUserToSubadminGroup with non existent user, existent group', function (done) {
    oc.users.addUserToSubadminGroup(nonExistingUser, testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('User does not exist')
      done()
    })
  })

  it('checking method : getUserSubadminGroups with a non existent user', function (done) {
    oc.users.getUserSubadminGroups(nonExistingUser).then(data => {
      expect(typeof (data)).toBe('object')
      expect(data.length).toEqual(0)
      done()
    }).catch(error => {
      expect(error).toBe('User does not exist')
      done()
    })
  })

  it('checking method : userIsInSubadminGroup with existent user, non existent group', function (done) {
    oc.users.userIsInSubadminGroup(testUser, nonExistingGroup)
      .then(status => {
        expect(status).toBe(false)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
  })

  it('checking method : userIsInSubadminGroup with non existent user, existent group', function (done) {
    oc.users.userIsInSubadminGroup(nonExistingUser, testGroup)
      .then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error).toBe('User does not exist')
        done()
      })
  })

  it('checking method : deleteUser on a non existent user', function (done) {
    oc.users.deleteUser(nonExistingUser).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(typeof (error)).toBe('object')
      expect(error.ocs.meta.statuscode).toEqual('101')
      done()
    })
  })
})
