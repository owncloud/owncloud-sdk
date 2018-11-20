/* globals OwnCloud, __karma__ */

describe('Currently testing Login and initLibrary,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var nonExistingUser = 'nonExistingUser' + timeRightNow

  var config = __karma__.config.ownCloudConfig
  var username = config.username
  var password = config.password
  var owncloudURL = config.owncloudURL

  beforeEach(function () {
    oc = null
  })

  it('checking method : initLibrary to be null', function () {
    expect(oc).toBe(null)
  })

  it('checking method : initLibrary', function () {
    oc = new OwnCloud('someRandomName')

    expect(oc).not.toBe(null)
  })

  it('checking method : login with a non existent instance URL', function (done) {
    oc = new OwnCloud('someRandomName')

    oc.login(username, password).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })

  it('checking method : login with wrong username and password', function (done) {
    oc = new OwnCloud(owncloudURL)

    oc.login(nonExistingUser, 'password' + timeRightNow).then(status => {
      expect(status).tobe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })

  it('checking method : login with correct username only', function (done) {
    oc = new OwnCloud(owncloudURL)

    oc.login(username, 'password' + timeRightNow).then(status => {
      expect(status).tobe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })

  it('checking method : login with correct username and password', function (done) {
    oc = new OwnCloud(owncloudURL)

    oc.login(username, password).then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })
})
