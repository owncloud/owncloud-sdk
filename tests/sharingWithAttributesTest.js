describe('oc.shares', function () {
  // CURRENT TIME
  const timeRightNow = Math.random().toString(36).substr(2, 9)
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const testUserPassword = 'password'
  const testUser = 'testUser' + timeRightNow

  const testFiles = [
    '/文件' + timeRightNow + '.txt',
    '/test' + timeRightNow + '.txt',
    '/test space and + and #' + timeRightNow + '.txt'
  ]

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
        const testFile = testFiles[0]
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
