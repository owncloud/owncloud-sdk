/* globals OwnCloud, __karma__ */

describe('Currently testing group management,', function () {
  console.log('Running Main tests')

  // CURRENT TIME
  var timeRightNow = new Date().getTime()

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testGroup = 'testGroup' + timeRightNow
  var nonExistingGroup = 'nonExistingGroup' + timeRightNow

  var config = __karma__.config.ownCloudConfig
  var username = config.username
  var password = config.password
  var owncloudURL = config.owncloudURL

  beforeEach(function (done) {
    oc = new OwnCloud(owncloudURL)
    oc.login(username, password).then(status => {
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
      expect(data.indexOf(username)).toBeGreaterThan(-1)
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
