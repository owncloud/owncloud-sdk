fdescribe('Unauthorized: Currently testing getConfig, getVersion and getCapabilities', function () {
  const OwnCloud = require('../../src')
  const config = require('../config/config.json')
  // LIBRARY INSTANCE
  let oc

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password + new Date().getTime()
        }
      }
    })

    oc.login()
  })

  it('checking method : getCapabilities', function (done) {
    oc.getCapabilities().then(capabilities => {
      expect(capabilities).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })
})
