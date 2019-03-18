describe('Main: Currently testing Login and initLibrary,', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // CURRENT TIME
  var timeRightNow = Math.random().toString(36).substr(2, 9)

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var nonExistingUser = 'nonExistingUser' + timeRightNow

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

    oc.login(config.username, config.password).then(() => {
      fail()
      done()
    }).catch(error => {
      // talking to some other server will result in rejection of the request due to CORS
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })

  it('checking method : login with wrong config.username and config.password', function (done) {
    oc = new OwnCloud(config.owncloudURL)

    oc.login(nonExistingUser, 'config.password' + timeRightNow).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : login with correct config.username only', function (done) {
    oc = new OwnCloud(config.owncloudURL)

    oc.login(config.username, 'config.password' + timeRightNow).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : login with correct config.username and config.password', function (done) {
    oc = new OwnCloud(config.owncloudURL)

    oc.login(config.username, config.password).then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })

  it('checking method: ctor with options', (done) => {
    oc = new OwnCloud(config.owncloudURL, {
      auth: {
        basic: {
          username: config.username,
          password: config.password
        }
      }
    })

    oc.getVersion().then(version => {
      expect(version).not.toBe(null)
      expect(typeof (version)).toEqual('string')
      expect(version.split('.').length).toBeGreaterThan(2)
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })
})
