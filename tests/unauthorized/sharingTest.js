describe('Unauthorized: Currently testing file/folder sharing,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var OwnCloud = require('../../src')
  var config = require('../config/config.json')

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testUser = 'testUser' + timeRightNow
  var testGroup = 'testGroup' + timeRightNow
  var testFolder = '/testFolder' + timeRightNow
  var nonExistingFile = 'nonExistingFile' + timeRightNow

  var testFile = '/文件' + timeRightNow + '.txt'

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

  it('checking method : shareFileWithLink', function (done) {
    oc.shares.shareFileWithLink(testFile).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : shareFileWithUser', function (done) {
    oc.shares.shareFileWithUser(testFile, testUser).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : shareFileWithGroup', function (done) {
    oc.shares.shareFileWithGroup(testFile, testGroup, {
      permissions: 19
    }).then(share => {
      expect(share).toEqual(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : isShared', function (done) {
    oc.shares.isShared(nonExistingFile).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getShare', function (done) {
    oc.shares.getShare(1).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getShares', function (done) {
    oc.shares.getShares(1).then(shares => {
      expect(shares).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : updateShare', function (done) {
    oc.shares.shareFileWithLink(testFolder).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : deleteShare', function (done) {
    oc.shares.deleteShare(123).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })
})
