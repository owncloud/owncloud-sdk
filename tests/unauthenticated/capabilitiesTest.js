describe('Unauthenticated: Currently testing getConfig, getVersion and getCapabilities', function () {
  var OwnCloud = require('../../src')
  var config = require('../config/config.json')

  // LIBRARY INSTANCE
  var oc

  beforeEach(function () {
    oc = new OwnCloud(config.owncloudURL)
  })

  it('checking method : getConfig', function (done) {
    oc.getConfig().then(config => {
      expect(config).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : getVersion', function (done) {
    oc.getVersion().then(version => {
      expect(version).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : getCapabilities', function (done) {
    oc.getCapabilities().then(capabilities => {
      expect(capabilities).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })
})
