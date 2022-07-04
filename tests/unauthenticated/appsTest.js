describe('Unauthenticated: Currently testing apps management,', function () {
  const OwnCloud = require('../../src')
  const { getMockServerBaseUrl } = require('../helpers/pactHelper.js')
  const mockServerBaseUrl = getMockServerBaseUrl()
  // LIBRARY INSTANCE
  let oc

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: mockServerBaseUrl
    })
  })

  it('checking method : getApps', function (done) {
    oc.apps.getApps().then(apps => {
      expect(apps).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : enableApp when app exists', function (done) {
    oc.apps.enableApp('files').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : disableApp', function (done) {
    oc.apps.disableApp('files').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })
})
