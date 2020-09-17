fdescribe('oc.shares', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const {
    owncloudURL,
    username,
    password,
    testUser,
    testUserPassword,
    testFile
  } = config

  describe('when using share attributes', function () {
    beforeEach(function (done) {
      oc = new OwnCloud({
        baseUrl: owncloudURL,
        auth: {
          basic: {
            username: username,
            password: password
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
      fit('shall share with permissions in attributes', function (done) {
        // const testFile = testFiles[0]
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
