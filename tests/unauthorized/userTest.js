fdescribe('Unauthorized: Currently testing user management,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var OwnCloud = require('../../src')
  var config = require('../config/config.json')

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testUserPassword = 'password'

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password + timeRightNow
        }
      }
    })

    oc.login()
  })

  it('checking method : getUser', function (done) {
    oc.users.getUser(config.username).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : createUser', function (done) {
    oc.users.createUser('newUser' + timeRightNow, testUserPassword).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : searchUsers', function (done) {
    oc.users.searchUsers('').then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : userExists', function (done) {
    oc.users.userExists(config.username).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : setUserAttribute', function (done) {
    oc.users.setUserAttribute(config.testUser, 'email', 'asd@a.com').then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : addUserToGroup', function (done) {
    oc.users.addUserToGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getUserGroups', function (done) {
    oc.users.getUserGroups(config.testUser).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : userIsInGroup', function (done) {
    oc.users.userIsInGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getUser', function (done) {
    oc.users.getUser(config.testUser).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : removeUserFromGroup', function (done) {
    oc.users.removeUserFromGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : addUserToSubadminGroup', function (done) {
    oc.users.addUserToSubadminGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getUserSubadminGroups', function (done) {
    oc.users.getUserSubadminGroups(config.testUser).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : userIsInSubadminGroup', function (done) {
    oc.users.userIsInSubadminGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : deleteUser', function (done) {
    oc.users.deleteUser(config.nonExistingUser).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })
})
