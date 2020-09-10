fdescribe('Unauthorized: Currently testing apps management,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var OwnCloud = require('../../src')
  var config = require('../config/config.json')

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testApp = 'someAppName' + timeRightNow

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

  fit('checking method : getApps', function (done) {
    oc.apps.getApps().then(apps => {
      expect(apps).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : setAttribute', function (done) {
    var key = ['attr1', 'attr+plus space', '属性1']
    var value = ['value1', 'value+plus space and/slash', '值对1']
    var count = 0

    for (var i = 0; i < key.length; i++) {
      oc.apps.setAttribute(testApp, key[i], value[i]).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error).toMatch('Unauthorised')
        count++
        if (count === key.length) {
          done()
        }
      })
    }
  })

  it('checking method : getAttribute', function (done) {
    var key = ['attr1', 'attr+plus space', '属性1']
    var count = 0

    for (var i = 0; i < key.length; i++) {
      oc.apps.getAttribute(testApp, key[i]).then(data => {
        expect(data).toBe(null)
        done()
      }).catch(error => {
        expect(error).toMatch('Unauthorised')
        count++
        if (count === key.length) {
          done()
        }
      })
    }
  })

  it('checking method : deleteAttribute', function (done) {
    var key = ['attr1', 'attr+plus space', '属性1']
    var count = 0

    for (var i = 0; i < key.length; i++) {
      oc.apps.deleteAttribute(testApp, key[i]).then(status => {
        expect(status).toBe(null)
        done()
      }).catch(error => {
        expect(error).toMatch('Unauthorised')
        count++
        if (count === key.length) {
          done()
        }
      })
    }
  })

  fit('checking method : enableApp when app exists', function (done) {
    oc.apps.enableApp('files').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  fit('checking method : disableApp', function (done) {
    oc.apps.disableApp('files').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })
})
