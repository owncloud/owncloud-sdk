describe('Main: Currently testing url signing,', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc
  // saved date object
  var realDate

  beforeEach(function () {
    oc = null

    // Setup
    const currentDate = new Date('2019-05-14T11:01:58.135Z')
    realDate = Date
    global.Date = class extends Date {
      constructor (date) {
        if (date) {
          return super(date) // eslint-disable-line constructor-super
        }

        return currentDate
      }
    }
  })

  afterEach(function () {
    // Cleanup
    global.Date = realDate
  })

  it('checking method : signUrl', function (done) {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password
        }
      },
      signingKey: '1234567890',
      userInfo: {
        id: 'alice'
      }
    })

    oc.signUrl('http://cloud.example.net').then(signedUrl => {
      expect(signedUrl).toEqual('http://cloud.example.net/?OC-Credential=alice&OC-Date=2019-05-14T11%3A01%3A58.135Z&OC-Expires=1200&OC-Verb=GET&OC-Signature=f9e53a1ee23caef10f72ec392c1b537317491b687bfdd224c782be197d9ca2b6')
      done()
    }).catch(error => {
      fail(error)
      done()
    })
  })
})
