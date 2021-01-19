import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Main: Currently testing share recipient,', function () {
  var config = require('./config/config.json')

  const {
    validAuthHeaders,
    capabilitiesGETRequestValidAuth,
    GETRequestToCloudUserEndpoint,
    createOwncloud,
    createProvider
  } = require('./pactHelper.js')

  const getShareesRequest = (provider) => {
    return provider
      .uponReceiving('a request to get share recipients (both users and groups)')
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          /.*\/ocs\/v2\.php\/apps\/files_sharing\/api\/v1\/sharees$/,
          '/ocs/v2.php/apps/files_sharing/api/v1/sharees'
        ),
        query: { search: 'test', itemType: 'folder', page: '1', perPage: '200', format: 'json' },
        headers: validAuthHeaders
      }).willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: {
          ocs: {
            meta: { status: 'ok', statusCode: 200, message: 'OK', totalitems: '', itemsperpage: '' },
            data: {
              exact: { users: [], groups: [], remotes: [] },
              users: [{ label: config.testUser, value: { shareType: 0, shareWith: config.testUser } }],
              groups: [{ label: config.testGroup, value: { shareType: 1, shareWith: config.testGroup } }],
              remotes: []
            }
          }
        }
      })
  }

  it('testing behavior : invalid page', function () {
    const provider = createProvider()

    return provider.executeTest(() => {
      const oc = createOwncloud()

      return oc.shares.getRecipients('test', 'folder', 'a', 'b').then(status => {
        fail('share.getRecipients should have thrown an error.')
      }).catch(error => {
        expect(error.message).toBe('Please pass a valid page parameter (Integer)')
      })
    })
  })

  it('testing behavior : invalid perPage', function () {
    const provider = createProvider()

    return provider.executeTest(async () => {
      const oc = createOwncloud()

      return oc.shares.getRecipients('test', 'folder', 2, 'b').then(status => {
        fail('share.getRecipients should have thrown an error.')
      }).catch(error => {
        expect(error.message).toBe('Please pass a valid perPage parameter (Integer)')
      })
    })
  })

  it('testing behavior : negative page', function () {
    const provider = createProvider()

    return provider.executeTest(async () => {
      const oc = createOwncloud()

      return oc.shares.getRecipients('test', 'folder', -1, 'b').then(status => {
        fail('share.getRecipients should have thrown an error.')
      }).catch(error => {
        expect(error.message).toBe('Please pass a valid page parameter (Integer)')
      })
    })
  })

  it('testing behavior : searching for users and groups', async function () {
    const provider = createProvider()
    await capabilitiesGETRequestValidAuth(provider)
    await GETRequestToCloudUserEndpoint(provider)
    await getShareesRequest(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()

      return oc.shares.getRecipients('test', 'folder', 1, 200).then(resp => {
        expect(resp.users[0]).toMatchObject({
          label: config.testUser
        })
        expect(resp.groups[0]).toMatchObject({
          label: config.testGroup
        })
      }).catch(error => {
        fail('share.getRecipients threw an error: ' + error.message)
      })
    })
  })
})
