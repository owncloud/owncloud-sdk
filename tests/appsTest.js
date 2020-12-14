describe('Main: Currently testing apps management,', function () {
  const OwnCloud = require('../src/owncloud')
  const utf8 = require('utf8')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const nonExistentApp = 'nonExistentApp123'

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions, ocsMeta } = require('./pactHelper.js')
  const { validAuthHeaders, xmlResponseHeaders } = require('./pactHelper.js')

  const responseBody = function (data) {
    return '<?xml version="1.0"?>\n' +
    '<ocs>\n' +
    ocsMeta('ok', '100') +
    data +
    '</ocs>'
  }

  beforeAll(function (done) {
    const promises = []
    promises.push(setGeneralInteractions(provider))
    // a request to GET attributes of an app
    const attributes = {
      attr1: {
        attrExists: true,
        value: 'value1'
      },
      'attr+plus space': {
        attrExists: true,
        value: 'value+plus space and/slash'
      },
      属性1: {
        attrExists: true,
        value: '值对1'
      },
      'attr ': {
        attrExists: false,
        value: ''
      },
      'attr+plus space ': {
        attrExists: false,
        value: ''
      },
      '属性1 ': {
        attrExists: false,
        value: ''
      },
      '': {
        attrExists: false,
        value: {
          attr1: 'value1',
          'attr+plus space': 'value+plus space and/slash',
          属性1: '值对1'
        }
      },
      'attr1-no-value': {
        attrExists: true,
        value: ''
      },
      'attr+plus space-no-value': {
        attrExists: true,
        value: ''
      },
      '属性1-no-value': {
        attrExists: true,
        value: ''
      }
    }
    for (const attribute in attributes) {
      // default no data
      let data = ' <data/>\n'

      // no attributes specified, return all attributes
      if (!attribute) {
        data = ' <data>\n'
        for (const [key, value] of Object.entries(attributes[attribute].value)) {
          data = data +
            '  <element>\n' +
            '   <key>' + utf8.encode(key) + '</key>\n' +
            '   <app>' + config.testApp + '</app>\n' +
            '   <value>' + utf8.encode(value) + '</value>\n' +
            '  </element>\n'
        }
        data = data + ' </data>'
      } else if (attributes[attribute].attrExists) {
        // attribute exists
        data = ' <data>\n' +
          '  <element>\n' +
          '   <key>' + utf8.encode(attribute) + '</key>\n' +
          '   <app>' + config.testApp + '</app>\n' +
          '   <value>' + utf8.encode(attributes[attribute].value) + '</value>\n' +
          '  </element>\n' +
          ' </data>\n'
      }
      promises.push(provider.addInteraction({
        uponReceiving: 'a request to GET ' + attribute + '-attribute of an app',
        withRequest: {
          method: 'GET',
          path: Pact.Matchers.term({
            matcher: '.*\\/ocs\\/v1\\.php\\/privatedata\\/getattribute\\/' + config.testApp + '\\/?' + encodeURIComponent(utf8.encode(attribute)) + '$',
            generate: '/ocs/v1.php/privatedata/getattribute/' + config.testApp + '/' + encodeURIComponent(utf8.encode(attribute))
          }),
          headers: validAuthHeaders
        },
        willRespondWith: {
          status: 200,
          headers: xmlResponseHeaders,
          body: responseBody(data)
        }
      }))
    }

    const requests = ['POST', 'DELETE']
    for (let i = 0; i < requests.length; i++) {
      const action = (requests[i] === 'POST') ? 'enable' : 'disable'
      promises.push(provider.addInteraction({
        uponReceiving: action + ' apps',
        withRequest: {
          method: requests[i],
          path: Pact.Matchers.term({
            matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/apps\\/.+$',
            generate: '/ocs/v1.php/cloud/apps/files'
          }),
          headers: validAuthHeaders
        },
        willRespondWith: {
          status: 200,
          headers: xmlResponseHeaders,
          body: responseBody(' <data/>\n')
        }
      }))
    }

    Promise.all(promises).then(done, done.fail)
  })

  afterAll(function (done) {
    provider.removeInteractions().then(done, done.fail)
  })

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

  it('checking method : getApps', async function (done) {
    await provider.addInteraction({
      uponReceiving: 'a GET request for a list of apps',
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/apps$',
          generate: '/ocs/v1.php/cloud/apps'
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: xmlResponseHeaders,
        body: responseBody(' <data>\n' +
          '  <apps>\n' +
          '   <element>workflow</element>\n' +
          '   <element>files</element>\n' +
          '  </apps>\n' +
          ' </data>\n')
      }
    })
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
      const key = ['attr1', 'attr+plus space', '属性1']
      const value = ['value1', 'value+plus space and/slash', '值对1']
      let count = 0

      for (let i = 0; i < key.length; i++) {
        oc.apps.getAttribute(config.testApp, key[i]).then(data => {
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
      const key = ['attr ', 'attr+plus space ', '属性1 ']
      let count = 0

      for (let i = 0; i < key.length; i++) {
        oc.apps.getAttribute(config.testApp, key[i]).then(data => {
          expect(data).toEqual(null)
          done()
        }).catch(error => {
          let fl = 0
          for (let j = 0; j < key.length; j++) {
            if (error === config.testApp + ' has no key named "' + key[j] + '"') {
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
      const key = ['attr1', 'attr+plus space', '属性1']
      const value = ['value1', 'value+plus space and/slash', '值对1']
      let count = 0

      oc.apps.getAttribute(config.testApp).then(allAttributes => {
        for (let i = 0; i < key.length; i++) {
          expect(typeof (allAttributes)).toBe('object')
          expect(utf8.encode(key[i]) in allAttributes).toBe(true)
          const ocValue = utf8.decode(allAttributes[utf8.encode(key[i])])
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
    beforeAll(function (done) {
      const promises = []
      let data = ' <data>\n'
      const values = ['attr1', 'attr+plus space', '属性1']
      for (let i = 0; i < values.length; i++) {
        data = data +
          '  <element>\n' +
          '   <key>' + utf8.encode(values[i]) + '</key>\n' +
          '   <app>' + config.testApp + '-no-value</app>\n' +
          '   <value></value>\n' +
          '  </element>\n'
      }
      data = data + ' </data>'
      promises.push(provider.addInteraction({
        uponReceiving: 'a request to GET attributes of an app that has no values set',
        withRequest: {
          method: 'GET',
          path: Pact.Matchers.term({
            matcher: '.*\\/ocs\\/v1\\.php\\/privatedata\\/getattribute\\/' + config.testApp + '-no-value$',
            generate: '/ocs/v1.php/privatedata/getattribute/' + config.testApp + '-no-value'
          }),
          headers: validAuthHeaders
        },
        willRespondWith: {
          status: 200,
          headers: xmlResponseHeaders,
          body: responseBody(data)
        }
      }))
      Promise.all(promises).then(done, done.fail)
    })

    it('checking method : valid getAttribute', function (done) {
      const key = ['attr1-no-value', 'attr+plus space-no-value', '属性1-no-value']
      let count = 0

      for (let i = 0; i < key.length; i++) {
        oc.apps.getAttribute(config.testApp, key[i]).then(data => {
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
      const key = ['attr1', 'attr+plus space', '属性1']
      let count = 0

      oc.apps.getAttribute(config.testApp + '-no-value').then(allAttributes => {
        for (let i = 0; i < key.length; i++) {
          expect(typeof (allAttributes)).toBe('object')
          expect(utf8.encode(key[i]) in allAttributes).toBe(true)
          const ocValue = utf8.decode(allAttributes[utf8.encode(key[i])])
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
  it('checking method : disableApp when app exists', function (done) {
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

  it('checking method : enableApp when app doesn\'t exist', function (done) {
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
