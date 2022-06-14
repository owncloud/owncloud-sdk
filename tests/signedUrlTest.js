describe('Main: Currently testing url signing,', function () {
  var OwnCloud = require('../src/owncloud')
  const {
    admin: { username: adminUsername, password: adminPassword }
  } = require('./config/users.json')

  const { getMockServerBaseUrl } = require('./helpers/pactHelper.js')
  const mockServerBaseUrl = getMockServerBaseUrl()

  // saved date object
  var realDate

  beforeEach(function () {
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

  it('checking method : signUrl', function () {
    const oc = new OwnCloud({
      baseUrl: mockServerBaseUrl,
      auth: {
        basic: {
          username: adminUsername,
          password: adminPassword
        }
      },
      signingKey: '1234567890',
      userInfo: {
        id: 'alice'
      }
    })

    return oc.signUrl('http://cloud.example.net').then(signedUrl => {
      expect(signedUrl).toEqual(
        'http://cloud.example.net/?OC-Credential=alice&OC-Date=2019-05-14T11%3A01%3A58.135Z&OC-Expires=1200&OC-Verb=GET&OC-Algo=PBKDF2%2F10000-SHA512&OC-Signature=f9e53a1ee23caef10f72ec392c1b537317491b687bfdd224c782be197d9ca2b6'
      )
    }).catch(error => {
      fail(error)
    })
  })
})
