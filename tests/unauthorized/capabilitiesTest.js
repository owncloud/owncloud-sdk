/* globals OwnCloud, __karma__ */

describe('Currently testing getConfig, getVersion and getCapabilities', function () {
  // LIBRARY INSTANCE
  var oc

  var config = __karma__.config.ownCloudConfig
  var owncloudURL = config.owncloudURL

  beforeEach(function () {
    oc = new OwnCloud(owncloudURL)
    oc.login(config.username, config.password + new Date().getTime())
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
