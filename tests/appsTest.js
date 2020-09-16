fdescribe('Main: Currently testing apps management,', function () {
// CURRENT TIME
  var timeRightNow = Math.random().toString(36).substr(2, 9)
  var OwnCloud = require('../src/owncloud')
  var utf8 = require('utf8')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

  // TESTING CONFIGS
  var testApp = 'someAppName'
  var nonExistentApp = 'nonExistentApp' + timeRightNow

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

  it('checking method : getApps', function (done) {
    oc.apps.getApps().then(apps => {
      expect(apps).not.toBe(null)
      expect(typeof (apps)).toBe('object')
      expect(apps.files).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  // there are cors issues with this api
  describe('App attributes testing,', function () {
    it('checking method : valid getAttribute', function (done) {
      var key = ['attr1', 'attr+plus space', '属性1']
      var value = ['value1', 'value+plus space and/slash', '值对1']
      var count = 0

      for (var i = 0; i < key.length; i++) {
        oc.apps.getAttribute(testApp, key[i]).then(data => {
          expect(value.indexOf(utf8.decode(data))).toBeGreaterThan(-1)
          count++
          if (count === key.length) {
            done()
          }
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
      }
    })

    it('checking method : non existent getAttribute', function (done) {
      var key = ['attr ', 'attr+plus space ', '属性1 ']
      var count = 0

      for (var i = 0; i < key.length; i++) {
        oc.apps.getAttribute(testApp, key[i]).then(data => {
          expect(data).toEqual(null)
          done()
        }).catch(error => {
          var fl = 0
          for (var j = 0; j < key.length; j++) {
            if (error === testApp + ' has no key named "' + key[j] + '"') {
              fl = 1
            }
          }
          expect(fl).toBe(1)
          count++
          if (count === key.length) {
            done()
          }
        })
      }
    })

    it('checking method : getAttribute without key', function (done) {
      var key = ['attr1', 'attr+plus space', '属性1']
      var value = ['value1', 'value+plus space and/slash', '值对1']
      var count = 0

      oc.apps.getAttribute(testApp).then(allAttributes => {
        for (var i = 0; i < key.length; i++) {
          expect(typeof (allAttributes)).toBe('object')
          expect(utf8.encode(key[i]) in allAttributes).toBe(true)
          var ocValue = utf8.decode(allAttributes[utf8.encode(key[i])])
          expect(value.indexOf(ocValue)).toBeGreaterThan(-1)
          count++
          if (count === key.length) {
            done()
          }
        }
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })
  })

  describe('App attributes testing with empty value,', function () {
    it('checking method : valid getAttribute', function (done) {
      var key = ['attr1-no-value', 'attr+plus space-no-value', '属性1-no-value']
      var count = 0

      for (var i = 0; i < key.length; i++) {
        oc.apps.getAttribute(testApp, key[i]).then(data => {
          expect(utf8.decode(data)).toBe('')
          count++
          if (count === key.length) {
            done()
          }
        }).catch(error => {
          expect(error).toBe(null)
          done()
        })
      }
    })

    it('checking method : getAttribute without key', function (done) {
      var key = ['attr1', 'attr+plus space', '属性1']
      var count = 0

      oc.apps.getAttribute(testApp + '-no-value').then(allAttributes => {
        for (var i = 0; i < key.length; i++) {
          expect(typeof (allAttributes)).toBe('object')
          expect(utf8.encode(key[i]) in allAttributes).toBe(true)
          var ocValue = utf8.decode(allAttributes[utf8.encode(key[i])])
          expect(ocValue).toBe('')
          count++
          if (count === key.length) {
            done()
          }
        }
      }).catch(error => {
        expect(error).toBe(null)
        done()
      })
    })
  })

  it('checking method : enableApp when app exists', function (done) {
    oc.apps.enableApp('files').then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  // cors issue
  xit('checking method : disableApp when app exists', function (done) {
    oc.apps.disableApp('files').then(status => {
      expect(status).toBe(true)

      // Re-Enabling the Files App
      return oc.apps.enableApp('files')
    }).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })

  xit('checking method : enableApp when app doesn\'t exist', function (done) {
    oc.apps.enableApp(nonExistentApp).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toEqual('No app found by the name "' + nonExistentApp + '"')
      done()
    })
  })

  it('checking method : disableApp when app doesn\'t exist', function (done) {
    oc.apps.disableApp(nonExistentApp).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })
})
