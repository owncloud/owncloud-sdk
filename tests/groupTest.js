fdescribe('Main: Currently testing group management,', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions } = require('./pactHelper.js')

  beforeAll(function (done) {
    Promise.all(setGeneralInteractions(provider)).then(done, done.fail)
  })

  afterAll(function (done) {
    provider.removeInteractions().then(done, done.fail)
  })

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
    done()
  })

  it('checking method : getGroups', function (done) {
    oc.groups.getGroups().then(data => {
      expect(typeof (data)).toBe('object')
      expect(data.indexOf('admin')).toBeGreaterThan(-1)
      expect(data.indexOf(config.testGroup)).toBeGreaterThan(-1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : groupExists with an existing group', function (done) {
    oc.groups.groupExists('admin').then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : groupExists with a non-existent group', function (done) {
    oc.groups.groupExists(config.nonExistentGroup).then(status => {
      expect(status).toBe(false)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : getGroupMembers', function (done) {
    oc.groups.getGroupMembers('admin').then(data => {
      expect(typeof (data)).toBe('object')
      expect(data.indexOf(config.username)).toBeGreaterThan(-1)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('checking method : deleteGroup with a non-existent group', function (done) {
    oc.groups.deleteGroup(config.nonExistentGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(typeof (error)).toBe('object')
      expect(error.ocs.meta.statuscode).toEqual('101')
      done()
    })
  })
})
