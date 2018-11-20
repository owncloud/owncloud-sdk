describe('Unauthorized: Currently testing getConfig, getVersion and getCapabilities', function () {
  var OwnCloud = require('../../src')
  var config = require('../config/config.json')
  // LIBRARY INSTANCE
  var oc

  beforeEach(function () {
    oc = new OwnCloud(config.owncloudURL)
    oc.login(config.username, config.password + new Date().getTime())
  })

  it('checking method : getConfig', function (done) {
    oc.getConfig().then(config => {
      expect(config).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })

  it('checking method : getVersion', function (done) {
    oc.getVersion().then(version => {
      expect(version).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })

  it('checking method : getCapabilities', function (done) {
    oc.getCapabilities().then(capabilities => {
      expect(capabilities).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
      done()
    })
  })
})
