fdescribe('oc.shares', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions, validAuthHeaders, applicationXmlResponseHeaders, ocsMeta, shareResponseOcsData } = require('./pactHelper.js')

  // TESTING CONFIGS
  const { testUser, testFile, owncloudURL, username, password } = config
  const shareAttributes = {
    attributes: [
      { scope: 'ownCloud', key: 'read', value: 'true' },
      { scope: 'ownCloud', key: 'share', value: 'true' }
    ]
  }

  const shareAttributesResponse = () => {
    const response = []
    for (let i = 0; i < shareAttributes.attributes.length; i++) {
      response.push(`{
      &quot;scope&quot;:&quot;${shareAttributes.attributes[i].scope}&quot;,
      &quot;key&quot;:&quot;${shareAttributes.attributes[i].key}&quot;,
      &quot;enabled&quot;:&quot;${shareAttributes.attributes[i].value}&quot;
      }`)
    }
    return response
  }

  beforeAll(function (done) {
    const promises = []
    promises.push(setGeneralInteractions(provider))
    promises.push(provider.addInteraction({
      uponReceiving: 'Share with permissions in attributes',
      withRequest: {
        method: 'POST',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        }),
        headers: validAuthHeaders,
        body: `shareType=0&shareWith=${testUser}&path=%2F${testFile}&attributes%5B0%5D%5Bscope%5D=${shareAttributes.attributes[0].scope}&attributes%5B0%5D%5Bkey%5D=${shareAttributes.attributes[0].key}&attributes%5B0%5D%5Bvalue%5D=${shareAttributes.attributes[0].value}&attributes%5B1%5D%5Bscope%5D=${shareAttributes.attributes[1].scope}&attributes%5B1%5D%5Bkey%5D=${shareAttributes.attributes[1].key}&attributes%5B1%5D%5Bvalue%5D=${shareAttributes.attributes[1].value}`
      },
      willRespondWith: {
        status: 200,
        headers: applicationXmlResponseHeaders,
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ocsMeta('ok', '100') +
          ' <data>\n' +
          shareResponseOcsData(0, 7, 17, testFile) +
          `<share_with>${testUser}</share_with>\n` +
          `<share_with_displayname>${testUser}</share_with_displayname>` +
          `<attributes>${shareAttributesResponse()}</attributes>` +
          '</data>\n' +
          '</ocs>'
      }
    }))
    Promise.all(promises).then(done, done.fail)
  })

  afterAll(function (done) {
    provider.removeInteractions().then(done, done.fail)
  })

  beforeEach(function (done) {
    oc = new OwnCloud({
      baseUrl: owncloudURL,
      auth: {
        basic: {
          username: username,
          password: password
        }
      }
    })
    oc.login().then(() => {
      done()
    })
  })

  it('shall share with permissions in attributes', function (done) {
    return oc.files.putFileContents(testFile, '123456').then(() => {
      return oc.shares.shareFileWithUser(testFile, testUser, shareAttributes).then(share => {
        expect(share.getPermissions()).toBe(17)
        done()
      })
    })
  })
})
