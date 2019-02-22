describe('Main: Currently testing getConfig, getVersion and getCapabilities', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

  beforeEach(function (done) {
    oc = new OwnCloud(config.owncloudURL)
    oc.login(config.username, config.password).then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  afterEach(function () {
    oc.logout()
    oc = null
  })

  it('checking method : getConfig', function (done) {
    oc.getConfig().then(config => {
      expect(config).not.toBe(null)
      expect(typeof (config)).toBe('object')
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })

  it('checking method : getVersion', function (done) {
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

  it('checking method : getCapabilities', function (done) {
    oc.getCapabilities().then(capabilities => {
      expect(capabilities).not.toBe(null)
      expect(typeof (capabilities)).toBe('object')

      // Files App is never disabled
      expect(capabilities.files).not.toBe(null)
      expect(capabilities.files).not.toBe(undefined)

      // Big file chunking of files app is always on
      expect(parseInt(capabilities.files.bigfilechunking)).toEqual(1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })
})
