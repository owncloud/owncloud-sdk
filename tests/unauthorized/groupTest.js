fdescribe('Unauthorized: Currently testing group management,', function () {
  var OwnCloud = require('../../src')
  var config = require('../config/config.json')

  // CURRENT TIME
  var timeRightNow = new Date().getTime()

  // LIBRARY INSTANCE
  var oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions } = require('../pactHelper.js')

  beforeAll(function (done) {
    Promise.all(setGeneralInteractions(provider)).then(done, done.fail)
  })

  afterAll(function (done) {
    provider.removeInteractions().then(done, done.fail)
  })

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password + timeRightNow
        }
      }
    })

    oc.login()
  })

  it('checking method : createGroup', function (done) {
    oc.groups.createGroup('newGroup' + timeRightNow).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getGroups', function (done) {
    oc.groups.getGroups().then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : groupExists', function (done) {
    oc.groups.groupExists('admin').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getGroupMembers', function (done) {
    oc.groups.getGroupMembers('admin').then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : deleteGroup', function (done) {
    oc.groups.deleteGroup(config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })
})
