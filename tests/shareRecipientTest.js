import { MatchersV3 } from '@pact-foundation/pact'

describe('Main: Currently testing share recipient,', function () {
  var config = require('./config/config.json')
  const {
    testUser1: { username: sharer, password: sharerPassword, displayname: sharerDisplayname },
    testUser2: { username: receiver, displayname: receiverDisplayname }
  } = require('./config/users.json')

  const {
    getAuthHeaders,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createOwncloud,
    createProvider
  } = require('./helpers/pactHelper.js')

  const {
    givenGroupExists,
    givenUserExists
  } = require('./helpers/providerStateHelper')

  const getShareesInteraction = async (provider, folder = config.testFolder) => {
    await givenUserExists(provider, sharer)
    await givenUserExists(provider, receiver)
    await givenGroupExists(provider, config.testGroup)
    return provider
      .uponReceiving(`as '${sharer}', a GET request to get share recipients (both users and groups)`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          /.*\/ocs\/v2\.php\/apps\/files_sharing\/api\/v1\/sharees$/,
          '/ocs/v2.php/apps/files_sharing/api/v1/sharees'
        ),
        query: { search: 'test', itemType: 'folder', page: '1', perPage: '200', format: 'json' },
        headers: { authorization: getAuthHeaders(sharer, sharerPassword) }
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: {
          ocs: {
            meta: { status: 'ok', statuscode: 200, message: 'OK' },
            data: {
              exact: { users: [], groups: [], remotes: [] },
              users: [
                { label: MatchersV3.regex(`(${sharerDisplayname}|${sharer})`, sharer), value: { shareType: 0, shareWith: sharer } },
                { label: MatchersV3.regex(`(${receiverDisplayname}|${receiver})`, receiver), value: { shareType: 0, shareWith: receiver } }
              ],
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
      const oc = createOwncloud(sharer, sharerPassword)

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
      const oc = createOwncloud(sharer, sharerPassword)

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
      const oc = createOwncloud(sharer, sharerPassword)

      return oc.shares.getRecipients('test', 'folder', -1, 'b').then(status => {
        fail('share.getRecipients should have thrown an error.')
      }).catch(error => {
        expect(error.message).toBe('Please pass a valid page parameter (Integer)')
      })
    })
  })

  it('testing behavior : searching for users and groups', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider, sharer, sharerPassword)
    await getCurrentUserInformationInteraction(provider, sharer, sharerPassword)
    await getShareesInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(sharer, sharerPassword)
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
