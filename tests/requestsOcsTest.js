describe('Main: Currently testing low level OCS', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

  beforeEach(function () {
    oc = new OwnCloud(config.owncloudURL)
    oc.login(config.username, config.password)
  })

  afterEach(function () {
    oc.logout()
    oc = null
  })

  it('checking : capabilities', function (done) {
    oc.requests.ocs({
      service: 'cloud',
      action: 'capabilities'
    })
      .then(function (response) {
        expect(response.ok).toBe(true)
        return response.json()
      })
      .then(json => {
        let capabilities = json.ocs.data
        expect(capabilities).not.toBe(null)
        expect(typeof (capabilities)).toBe('object')

        // Files App is never disabled
        expect(capabilities.capabilities.files).not.toBe(null)
        expect(capabilities.capabilities.files).not.toBe(undefined)

        done()
      }).catch(error => {
        fail(error)
        done()
      })
  })

  it('checking : error behavior', function (done) {
    oc.requests.ocs({
      method: 'PUT',
      service: 'cloud',
      action: 'users/unknown-user',
      data: { 'display': 'Alice' }
    }).then(response => {
      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
      return response.json()
    }).then(json => {
      expect(json.ocs.meta.statuscode).toBe(997)
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })
})
