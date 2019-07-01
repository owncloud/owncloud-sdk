describe('Main: Currently testing group management,', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // CURRENT TIME
  var timeRightNow = Math.random().toString(36).substr(2, 9)

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testGroup = 'testGroup' + timeRightNow
  var nonExistingGroup = 'nonExistingGroup' + timeRightNow

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

    oc.login().then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      return oc.groups.createGroup(testGroup)
    }).then(status2 => {
      expect(status2).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  afterEach(function (done) {
    oc.groups.deleteGroup(testGroup).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    }).then(() => {
      oc.logout()
      oc = null
    })
  })

  it('checking method : getGroups', function (done) {
    oc.groups.getGroups().then(data => {
      expect(typeof (data)).toBe('object')
      expect(data.indexOf('admin')).toBeGreaterThan(-1)
      expect(data.indexOf(testGroup)).toBeGreaterThan(-1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : groupExists with an existing group', function (done) {
    oc.groups.groupExists('admin').then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : groupExists with a non existing group', function (done) {
    oc.groups.groupExists(nonExistingGroup).then(status => {
      expect(status).toBe(false)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : getGroupMembers', function (done) {
    oc.groups.getGroupMembers('admin').then(data => {
      expect(typeof (data)).toBe('object')
      expect(data.indexOf(config.username)).toBeGreaterThan(-1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : deleteGroup with a non existing group', function (done) {
    oc.groups.deleteGroup(nonExistingGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(typeof (error)).toBe('object')
      expect(error.ocs.meta.statuscode).toEqual('101')
      done()
    })
  })
})
