import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Main: Currently testing share recipient,', function () {
  var config = require('./config/config.json')

  const {
    getAuthHeaders,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createOwncloud,
    createProvider
  } = require('./pactHelper.js')

  const sharer = config.testUser
  const receiver = config.testUser2

  const getShareesInteraction = (provider, folder = config.testFolder) => {
    provider
      .given('the user is recreated', { username: sharer })
      .given('the user is recreated', { username: receiver })
      .given('group exists', { groupName: config.testGroup })
    return provider
      .uponReceiving('a request to get share recipients (both users and groups)')
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          /.*\/ocs\/v2\.php\/apps\/files_sharing\/api\/v1\/sharees$/,
          '/ocs/v2.php/apps/files_sharing/api/v1/sharees'
        ),
        query: { search: 'test', itemType: 'folder', page: '1', perPage: '200', format: 'json' },
        headers: { authorization: getAuthHeaders(sharer, sharer) }
      }).willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: {
          ocs: {
            meta: { status: 'ok', statuscode: 200, message: 'OK', totalitems: '', itemsperpage: '' },
            data: {
              exact: { users: [], groups: [], remotes: [] },
              users: [{ label: sharer, value: { shareType: 0, shareWith: sharer } }, { label: receiver, value: { shareType: 0, shareWith: receiver } }],
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
      const oc = createOwncloud(sharer, sharer)

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
      const oc = createOwncloud(sharer, sharer)

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
      const oc = createOwncloud(sharer, sharer)

      return oc.shares.getRecipients('test', 'folder', -1, 'b').then(status => {
        fail('share.getRecipients should have thrown an error.')
      }).catch(error => {
        expect(error.message).toBe('Please pass a valid page parameter (Integer)')
      })
    })
  })

  it('testing behavior : searching for users and groups', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider, sharer, sharer)
    await getCurrentUserInformationInteraction(provider, sharer, sharer)
    await getShareesInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(sharer, sharer)
      await oc.login()

      return oc.shares.getRecipients('test', 'folder', 1, 200).then(resp => {
        expect(resp.users[0]).toMatchObject({
          label: sharer
        })
        expect(resp.users[1]).toMatchObject({
          label: receiver
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
