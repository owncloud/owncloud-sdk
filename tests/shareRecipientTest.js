describe('Main: Currently testing share recipient,', function () {
  var OwnCloud = require('../src/owncloud')
  var config = require('./config/config.json')

  // LIBRARY INSTANCE
  var oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    validAuthHeaders,
    origin,
    CORSPreflightRequest,
    capabilitiesGETRequestValidAuth,
    GETRequestToCloudUserEndpoint,
    pactCleanup
  } = require('./pactHelper.js')

  beforeAll(function () {
    const promises = []
    promises.push(provider.addInteraction(CORSPreflightRequest()))
    promises.push(provider.addInteraction(capabilitiesGETRequestValidAuth()))
    promises.push(provider.addInteraction(GETRequestToCloudUserEndpoint()))
    return Promise.all(promises)
  })

  afterAll(function () {
    return pactCleanup(provider)
  })

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password
        }
      }
    })

    return oc.login()
  })

  it('testing behavior : invalid page', function (done) {
    oc.shares.getRecipients('test', 'folder', 'a', 'b').then(status => {
      fail('share.getRecipients should have thrown an error.')
      done()
    }).catch(error => {
      expect(error.message).toBe('Please pass a valid page parameter (Integer)')
      done()
    })
  })

  it('testing behavior : invalid perPage', function (done) {
    oc.shares.getRecipients('test', 'folder', 2, 'b').then(status => {
      fail('share.getRecipients should have thrown an error.')
      done()
    }).catch(error => {
      expect(error.message).toBe('Please pass a valid perPage parameter (Integer)')
      done()
    })
  })

  it('testing behavior : negative page', function (done) {
    oc.shares.getRecipients('test', 'folder', -1, 'b').then(status => {
      fail('share.getRecipients should have thrown an error.')
      done()
    }).catch(error => {
      expect(error.message).toBe('Please pass a valid page parameter (Integer)')
      done()
    })
  })

  it('testing behavior : searching for users and groups', async function (done) {
    await provider.addInteraction({
      uponReceiving: 'a request to get share recipients (both users and groups)',
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v2\\.php\\/apps\\/files_sharing\\/api\\/v1\\/sharees$',
          generate: '/ocs/v2.php/apps/files_sharing/api/v1/sharees'
        }),
        query: 'search=test&itemType=folder&page=1&perPage=200&format=json',
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': origin
        },
        body: '{"ocs"' +
          ':{"meta":{"status":"ok","statuscode":200,' +
          '"message":"OK","totalitems":"","itemsperpage":""},' +
          '"data":{"exact":{"users":[],"groups":[],"remotes":[]},' +
          `"users":[{"label":"${config.testUser}","value":{"shareType":0,"shareWith":"${config.testUser}"}}],` +
          `"groups":[{"label":"${config.testGroup}","value":{"shareType":1,"shareWith":"${config.testGroup}"}}],` +
          '"remotes":[]}}}'
      }
    })
    oc.shares.getRecipients('test', 'folder', 1, 200).then(resp => {
      expect(resp.users).toContain(jasmine.objectContaining({
        label: config.testUser
      }))
      expect(resp.groups).toContain(jasmine.objectContaining({
        label: config.testGroup
      }))
      done()
    }).catch(error => {
      fail('share.getRecipients threw an error: ' + error.message)
      done()
    })
  })
})
