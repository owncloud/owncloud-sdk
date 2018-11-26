describe('Main: Currently testing Login and initLibrary,', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // CURRENT TIME
  var timeRightNow = new Date().getTime()

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

    oc.login(config.username, config.password).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })

  it('checking method : login with wrong config.username and config.password', function (done) {
    oc = new OwnCloud(config.owncloudURL)

    oc.login(nonExistingUser, 'config.password' + timeRightNow).then(status => {
      expect(status).tobe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })

  it('checking method : login with correct config.username only', function (done) {
    oc = new OwnCloud(config.owncloudURL)

    oc.login(config.username, 'config.password' + timeRightNow).then(status => {
      expect(status).tobe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })

  it('checking method : login with correct config.username and config.password', function (done) {
    oc = new OwnCloud(config.owncloudURL)

    oc.login(config.username, config.password).then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      done()
    }).catch(error => {
      expect(error).toBe(null)
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
      expect(error).tobe(null)
      done()
    })
  })
})
