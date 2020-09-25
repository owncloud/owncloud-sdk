fdescribe('oc.shares', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

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

  const testFile = config.testFile

  describe('when using share attributes', function () {
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

      return oc.login().then(() => {
        // CREATING TEST USER
        return oc.users.createUser(testUser, testUserPassword).then(status => {
          expect(status).toBe(true)
          done()
        })
      })
    })

    afterEach(function (done) {
      return oc.users.deleteUser(testUser).then(status => {
        expect(status).toBe(true)
        done()
      })
    })

    describe('with sharedFilesByUser', function () {
      it('shall share with permissions in attributes', function (done) {
        return oc.files.putFileContents(testFile, '123456').then(() => {
          return oc.shares.shareFileWithUser(testFile, testUser, {
            attributes: [
              { scope: 'ownCloud', key: 'read', value: 'true' },
              { scope: 'ownCloud', key: 'share', value: 'true' }
            ]
          }).then(share => {
            expect(share.getPermissions()).toBe(17)
            done()
          })
        })
      })
    })
  })
})
