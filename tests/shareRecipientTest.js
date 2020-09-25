fdescribe('Main: Currently testing share recipient,', function () {
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

  // TESTING CONFIGS
  const testUserPassword = config.testUserPassword
  const testUser = config.testUser
  const testGroup = config.testGroup

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

    oc.login().then(() => {
      // CREATING TEST USER
      oc.users.createUser(testUser, testUserPassword).then(status => {
        expect(status).toBe(true)
        // CREATING TEST GROUP
        return oc.groups.createGroup(testGroup)
      }).then(status => {
        expect(status).toBe(true)
        done()
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })
  })

  afterEach(function (done) {
    oc.users.deleteUser(testUser).then(status => {
      expect(status).toBe(true)
      return oc.groups.deleteGroup(testGroup)
    }).then(status2 => {
      expect(status2).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  it('testing behavior : invalid page', function (done) {
    oc.shares.getRecipients('test', 'folder', 'a', 'b').then(status => {
      fail('share.getRecipients should have thrown an error.')
      done()
    }).catch(error => {
      expect(error.message).toBe('Please pass a valid page parameter (Integer)')
      done()
    })
  })

  it('testing behavior : invalid perPage', function (done) {
    oc.shares.getRecipients('test', 'folder', 2, 'b').then(status => {
      fail('share.getRecipients should have thrown an error.')
      done()
    }).catch(error => {
      expect(error.message).toBe('Please pass a valid perPage parameter (Integer)')
      done()
    })
  })

  it('testing behavior : negative page', function (done) {
    oc.shares.getRecipients('test', 'folder', -1, 'b').then(status => {
      fail('share.getRecipients should have thrown an error.')
      done()
    }).catch(error => {
      expect(error.message).toBe('Please pass a valid page parameter (Integer)')
      done()
    })
  })

  it('testing behavior : searching for users and groups', function (done) {
    oc.shares.getRecipients('test', 'folder', 1, 200).then(resp => {
      expect(resp.users).toContain(jasmine.objectContaining({
        label: testUser
      }))
      expect(resp.groups).toContain(jasmine.objectContaining({
        label: testGroup
      }))
      done()
    }).catch(error => {
      fail('share.getRecipients threw an error: ' + error.message)
      done()
    })
  })
})
