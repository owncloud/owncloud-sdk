describe('Unauthenticated: Currently testing file/folder sharing,', function () {
  // CURRENT TIME
  const timeRightNow = new Date().getTime()
  const OwnCloud = require('../../src')
  const { getMockServerBaseUrl } = require('../helpers/pactHelper.js')
  const mockServerBaseUrl = getMockServerBaseUrl()
  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const testUser = 'testUser' + timeRightNow
  const testGroup = 'testGroup' + timeRightNow
  const testFolder = '/testFolder' + timeRightNow
  const nonExistentFile = 'nonExistentFile' + timeRightNow

  const testFile = '/文件' + timeRightNow + '.txt'

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: mockServerBaseUrl
    })
  })

  it('checking method : shareFileWithLink', function (done) {
    oc.shares.shareFileWithLink(testFile).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : shareFileWithUser', function (done) {
    oc.shares.shareFileWithUser(testFile, testUser).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
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
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : isShared', function (done) {
    oc.shares.isShared(nonExistentFile).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : getShare', function (done) {
    oc.shares.getShare(1).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : getShares', function (done) {
    oc.shares.getShares(1).then(shares => {
      expect(shares).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : updateShare', function (done) {
    oc.shares.shareFileWithLink(testFolder).then(share => {
      expect(share).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : deleteShare', function (done) {
    oc.shares.deleteShare(123).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })
})
