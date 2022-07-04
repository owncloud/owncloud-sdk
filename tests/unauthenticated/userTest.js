describe('Unauthenticated: Currently testing user management,', function () {
  // CURRENT TIME
  const timeRightNow = new Date().getTime()
  const OwnCloud = require('../../src')
  const config = require('../config/config.json')
  const { getMockServerBaseUrl } = require('../helpers/pactHelper.js')
  const mockServerBaseUrl = getMockServerBaseUrl()

  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const testUser = 'testUser' + timeRightNow
  const testUserPassword = 'password'
  const testGroup = 'testGroup' + timeRightNow
  const nonExistentUser = 'nonExistentUser' + timeRightNow

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: mockServerBaseUrl
    })
  })

  it('checking method : getUser', function (done) {
    oc.users.getUser(config.adminUsername).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : createUser', function (done) {
    oc.users.createUser('newUser' + timeRightNow, testUserPassword).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : searchUsers', function (done) {
    oc.users.searchUsers('').then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : userExists', function (done) {
    oc.users.userExists(config.adminUsername).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : setUserAttribute', function (done) {
    oc.users.setUserAttribute(testUser, 'email', 'asd@a.com').then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : addUserToGroup', function (done) {
    oc.users.addUserToGroup(testUser, testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : getUserGroups', function (done) {
    oc.users.getUserGroups(testUser).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : userIsInGroup', function (done) {
    oc.users.userIsInGroup(testUser, testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : getUser', function (done) {
    oc.users.getUser(testUser).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : removeUserFromGroup', function (done) {
    oc.users.removeUserFromGroup(testUser, testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : addUserToSubadminGroup', function (done) {
    oc.users.addUserToSubadminGroup(testUser, testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : getUserSubadminGroups', function (done) {
    oc.users.getUserSubadminGroups(testUser).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : userIsInSubadminGroup', function (done) {
    oc.users.userIsInSubadminGroup(testUser, testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : deleteUser', function (done) {
    oc.users.deleteUser(nonExistentUser).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })
})
