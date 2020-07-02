describe('Signed urls', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

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

    oc.login().then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  afterEach(function () {
    oc.logout()
    oc = null
  })

  it('should allow file download with a signUrl', async function (done) {
    const newFolder = 'test-folder-' + Math.random().toString(36).substr(2, 9)
    await oc.files.createFolder(newFolder)
    await oc.files.putFileContents(newFolder + '/file.txt', '123456')
    const url = oc.files.getFileUrlV2(newFolder + '/file.txt')
    const signedUrl = await oc.signUrl(url)
    const response = await fetch(signedUrl)
    expect(response.ok).toEqual(true)
    const txt = await response.text()
    expect(txt).toEqual('123456')

    done()
  })
})
