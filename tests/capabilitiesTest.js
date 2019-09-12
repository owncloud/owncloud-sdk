describe('Main: Currently testing getConfig, getVersion and getCapabilities', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

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
      done()
    }).catch(error => {
      fail(error)
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

  it('checking method : getCapabilities', function (done) {
    oc.getCapabilities().then(capabilities => {
      expect(capabilities).not.toBe(null)
      expect(typeof (capabilities)).toBe('object')

      // Files App is never disabled
      expect(capabilities.capabilities.files).not.toBe(null)
      expect(capabilities.capabilities.files).not.toBe(undefined)

      // Big file chunking of files app is always on
      expect(capabilities.capabilities.files.bigfilechunking).toEqual(true)
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })
})
