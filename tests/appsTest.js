/* globals OwnCloud, __karma__ */

describe('Currently testing apps management,', function () {
// CURRENT TIME
  var timeRightNow = new Date().getTime()

  // LIBRARY INSTANCE
  var oc

  var utf8 = window.utf8

  // TESTING CONFIGS
  var testApp = 'someAppName' + timeRightNow
  var nonExistingApp = 'nonExistingApp' + timeRightNow

  var config = __karma__.config.ownCloudConfig
  var username = config.username
  var password = config.password
  var owncloudURL = config.owncloudURL

  beforeEach(function () {
    oc = new OwnCloud(owncloudURL)
    oc.login(username, password)
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
    beforeEach(function (done) {
      var key = ['attr1', 'attr+plus space', '属性1']
      var value = ['value1', 'value+plus space and/slash', '值对1']
      var count = 0

      for (var i = 0; i < key.length; i++) {
        oc.apps.setAttribute(testApp, key[i], value[i]).then(status => {
          expect(status).toBe(true)
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

    afterEach(function (done) {
      var key = ['attr1', 'attr+plus space', '属性1']
      var count = 0

      for (var i = 0; i < key.length; i++) {
        oc.apps.deleteAttribute(testApp, key[i]).then(status => {
          expect(status).toBe(true)
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
    beforeEach(function (done) {
      var key = ['attr1', 'attr+plus space', '属性1']
      var count = 0

      for (var i = 0; i < key.length; i++) {
        oc.apps.setAttribute(testApp, key[i], '').then(status => {
          expect(status).toBe(true)
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

    afterEach(function (done) {
      var key = ['attr1', 'attr+plus space', '属性1']
      var count = 0

      for (var i = 0; i < key.length; i++) {
        oc.apps.deleteAttribute(testApp, key[i]).then(status => {
          expect(status).toBe(true)
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

    it('checking method : valid getAttribute', function (done) {
      var key = ['attr1', 'attr+plus space', '属性1']
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

      oc.apps.getAttribute(testApp).then(allAttributes => {
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
    oc.apps.enableApp(nonExistingApp).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toEqual('No app found by the name "' + nonExistingApp + '"')
      done()
    })
  })

  it('checking method : disableApp when app doesn\'t exist', function (done) {
    oc.apps.disableApp(nonExistingApp).then(status => {
      expect(status).toBe(true)
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })
})
