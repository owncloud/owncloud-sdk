import { pactWith } from './jestPact'
import { Matchers } from '@pact-foundation/pact'

pactWith({
  consumer: 'owncloud-sdk',
  provider: 'oc-server',
  port: 1234,
  cors: false
}, provider => {
  describe('Main: Currently testing getConfig, getVersion and getCapabilities', () => {
    const OwnCloud = require('../src/owncloud')
    const config = require('./config/config.json')

    // LIBRARY INSTANCE
    let oc

    const {
      setGeneralInteractions,
      validAuthHeaders,
      xmlResponseHeaders,
      ocsMeta
    } = require('./pactHelper.js')

    beforeEach(async () => {
      const promises = []
      promises.push(setGeneralInteractions(provider))
      promises.push(provider.addInteraction({
        uponReceiving: 'GET config request',
        withRequest: {
          method: 'GET',
          path: Matchers.regex({
            matcher: '.*\\/ocs\\/v(1|2)\\.php\\/config',
            generate: '/ocs/v1.php/config'
          }),
          headers: validAuthHeaders
        },
        willRespondWith: {
          status: 200,
          headers: xmlResponseHeaders,
          body: '<?xml version="1.0"?>\n' +
            '<ocs>\n' +
            ocsMeta('ok', '100') +
            ' <data>\n' +
            '  <version>1.7</version>\n' +
            '  <website>ownCloud</website>\n' +
            '  <host>localhost</host>\n' +
            '  <contact></contact>\n' +
            '  <ssl>false</ssl>\n' +
            ' </data>\n' +
            '</ocs>'

          //   new XmlBuilder('1.0', 'UTF-8', 'animals').build(el => {
          //   el.eachLike('lion', {
          //     id: integer(1),
          //     available_from: datetime('yyyy-MM-dd\'T\'HH:mm:ss.SSSX'),
          //     first_name: string('Slinky'),
          //     last_name: string('Malinky'),
          //     age: integer(27),
          //     gender: regex('M|F', 'F'),
          //   })
          //   el.eachLike('goat', {
          //     id: integer(3),
          //     available_from: datetime('yyyy-MM-dd\'T\'HH:mm:ss.SSSX'),
          //     first_name: string('Head'),
          //     last_name: string('Butts'),
          //     age: integer(27),
          //     gender: regex('M|F', 'F'),
          //   })
          // })


          //   new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          //   ocs.appendElement('meta', '', (meta) => {
          //     meta.appendElement('status', '', 'ok')
          //       .appendElement('statuscode', '', '100')
          //       .appendElement('message', '', '')
          //   }).appendElement('data', '', (data) => {
          //     data.appendElement('version', '1.7')
          //   })
          // })



          // matcher: '<?xml version="1.0"?>\n' +
          //   '<ocs>\n' +
          //   ocsMeta('ok', '100') +
          //   ' <data>\n' +
          //   '  <version>1.7<\\/version>\n' +
          //   '  <website>ownCloud</website>\n' +
          //   '  <host>localhost:\\d+<\\/host>\n' +
          //   '  <contact><\\/contact>\n' +
          //   '  <ssl>false<\\/ssl>\n' +
          //   ' <\\/data>\n' +
          //   '<\\/ocs>',
          // generate: '<ocs>\n' +
          //   ocsMeta('ok', '100') +
          //   ' <data>\n' +
          //   '  <version>1.7</version>\n' +
          //   '  <website>ownCloud</website>\n' +
          //   '  <host>localhost</host>\n' +
          //   '  <contact></contact>\n' +
          //   '  <ssl>false</ssl>\n' +
          //   ' </data>\n' +
          //   '</ocs>'
          // })
        }
      }))
      await Promise.all(promises)
    })

    afterEach(() => {
      provider.removeInteractions()
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
        expect(status).toEqual({
          id: 'admin',
          'display-name': 'admin',
          email: {}
        })
        done()
      }).catch(error => {
        fail(error)
        done()
      })
    })

    afterEach(function () {
      oc.logout()
      oc = null
    })

    it('checking method : getConfig', async () => {
      await oc.getConfig().then(config => {
        expect(config).not.toBe(null)
        expect(typeof (config)).toBe('object')
      }).catch(error => {
        fail(error)
      })
    })

    it('checking method : getCapabilities', async () => {
      await oc.getCapabilities().then(capabilities => {
        expect(capabilities).not.toBe(null)
        expect(typeof (capabilities)).toBe('object')

        // Files App is never disabled
        expect(capabilities.capabilities.files).not.toBe(null)
        expect(capabilities.capabilities.files).not.toBe(undefined)

        // Big file chunking of files app is always on
        expect(capabilities.capabilities.files.bigfilechunking).toEqual(true)
      }).catch(error => {
        fail(error)
      })
    })
  })
})
