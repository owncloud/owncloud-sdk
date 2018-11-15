/* globals OwnCloud, __karma__ */

describe('Currently testing getConfig, getVersion and getCapabilities', function () {
  // LIBRARY INSTANCE
  var oc

  var config = __karma__.config.ownCloudConfig
  var username = config.username
  var password = config.password
  var owncloudURL = config.owncloudURL

  beforeEach(function () {
    oc = new OwnCloud(owncloudURL)
    oc.login(username, password)
  })

  it('checking method : getConfig', function (done) {
    oc.getConfig().then(config => {
      expect(config).not.toBe(null)
      expect(typeof (config)).toBe('object')
      done()
    }).catch(error => {
      expect(error).toMatch('CORS request rejected')
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
