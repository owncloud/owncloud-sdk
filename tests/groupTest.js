import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing group management,', function () {
  const config = require('./config/config.json')
  const username = config.adminUsername
  let provider = null

  const {
    createProvider,
    validAdminAuthHeaders,
    xmlResponseHeaders,
    ocsMeta,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createOwncloud
  } = require('./pactHelper.js')

  async function getGroupsInteraction (provider) {
    await provider
      .given('group exists', { groupName: 'admin' })
      .given('group exists', { groupName: config.testGroup })
      .uponReceiving(`as '${username}', a GET request to get all groups`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          /.*\/ocs\/v1\.php\/cloud\/groups$/,
          '/ocs/v1.php/cloud/groups'
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
          })
            .appendElement('data', '', (data) => {
              // TODO: adjust the following after the issue is resolved
              // https://github.com/pact-foundation/pact-js/issues/619
              data.appendElement('groups', '', (groups) => {
                groups.appendElement('element', '', config.adminUsername)
                  .eachLike('element', '', group => {
                    group.appendText(config.testGroup)
                  })
              })
            })
        })
      })
  }

  async function deleteGroupInteraction (provider, group, responseBody) {
    if (group === config.nonExistentGroup) {
      await provider
        .given('group does not exist', { groupName: group })
    } else {
      await provider
        .given('group exists', { groupName: group })
    }

    await provider
      .uponReceiving(`as '${username}', a DELETE request to delete a group '${group}'`)
      .withRequest({
        method: 'DELETE',
        path: MatchersV3.regex(
          new RegExp('.*\\/ocs\\/v1\\.php\\/cloud\\/groups\\/' + group + '$'),
          '/ocs/v1.php/cloud/groups/' + group
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', responseBody)
            .appendElement('data', '', '')
        })
      })
  }

  it('checking method : getGroups', async function () {
    provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getGroupsInteraction(provider)
    await provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.groups.getGroups().then(data => {
        expect(typeof (data)).toBe('object')
        expect(data.indexOf('admin')).toBeGreaterThan(-1)
        expect(data.indexOf(config.testGroup)).toBeGreaterThan(-1)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : groupExists with an existing group', async function () {
    provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getGroupsInteraction(provider)
    await provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.groups.groupExists(config.testGroup).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : groupExists with a non-existent group', async function () {
    provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getGroupsInteraction(provider)
    await provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.groups.groupExists(config.nonExistentGroup).then(status => {
        expect(status).toBe(false)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : getGroupMembers', async function () {
    provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await provider
      .given('group exists', { groupName: config.testGroup })
      .given('the user is recreated', { username: config.testUser, password: config.testUserPassword })
      .given('user is added to group', { username: config.testUser, groupName: config.testGroup })
      .uponReceiving(`as '${username}', a GET request to get all members of existing group`)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          /.*\/ocs\/v1\.php\/cloud\/groups\/.*$/,
          '/ocs/v1.php/cloud/groups/' + config.testGroup
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
          }).appendElement('data', '', (data) => {
            // TODO: adjust the following after the issue is resolved
            // https://github.com/pact-foundation/pact-js/issues/619
            data.appendElement('users', '', (users) => {
              users.eachLike('element', '', user => {
                user.appendText(config.testUser)
              })
            })
          })
        })
      })
    await provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.groups.getGroupMembers(config.testGroup).then(data => {
        expect(typeof (data)).toBe('object')
        expect(data.indexOf(config.testUser)).toBeGreaterThan(-1)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  // ocis response is different from oc10
  // https://github.com/owncloud/ocis/issues/1766
  it('checking method : deleteGroup with a non-existent group', async function () {
    provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await deleteGroupInteraction(
      provider,
      config.nonExistentGroup,
      meta => ocsMeta(meta, 'failure', '101')
    )
    await provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.groups.deleteGroup(config.nonExistentGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('101')
      })
    })
  })

  it('checking method : createGroup', async function () {
    provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    const headers = { ...validAdminAuthHeaders, ...{ 'Content-Type': 'application/x-www-form-urlencoded' } }
    await provider
      .given('group does not exist', { groupName: config.testGroup })
      .uponReceiving(`as '${username}', a POST request to create a group`)
      .withRequest({
        method: 'POST',
        path: MatchersV3.regex(
          /.*\/ocs\/v1\.php\/cloud\/groups$/,
          '/ocs/v1.php/cloud/groups'
        ),
        headers: headers,
        body: 'groupid=' + config.testGroup
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
          })
            .appendElement('data', '', '')
        })
      })
    await provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.groups.createGroup(config.testGroup).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : delete a group', async function () {
    provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await deleteGroupInteraction(
      provider,
      config.testGroup,
      meta => ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
    )
    await provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.groups.deleteGroup(config.testGroup).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })
})
