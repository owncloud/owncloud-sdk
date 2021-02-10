import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing group management,', function () {
  const config = require('./config/config.json')
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
      .given('group exists', { groupName: config.testGroup })
      .uponReceiving('a GET groups request')
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
            return ocsMeta(meta, 'ok', '100')
          })
            .appendElement('data', '', (data) => {
              data.appendElement('groups', '', (groups) => {
                groups.appendElement('element', '', 'admin')
                groups.appendElement('element', '', config.testGroup)
              })
            })
        })
      })
  }

  async function deleteGroupInteraction (provider, group) {
    if (group === config.nonExistentGroup) {
      await provider
        .given('group does not exist', { groupName: group })
    } else {
      await provider
        .given('group exists', { groupName: group })
    }

    await provider
      .uponReceiving('a DELETE request for group, ' + group)
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
          ocs.appendElement('meta', '', (meta) => {
            return (group === config.nonExistentGroup) ? ocsMeta(meta, 'failure', '101') : ocsMeta(meta, 'ok', '100')
          })
            .appendElement('data', '', '')
        })
      })
  }

  beforeEach(async function () {
    provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
  })

  it('checking method : getGroups', async function () {
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
    await getGroupsInteraction(provider)
    await provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.groups.groupExists('admin').then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : groupExists with a non-existent group', async function () {
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
    await provider
      .uponReceiving('a request to GET members of the admin group')
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          /.*\/ocs\/v1\.php\/cloud\/groups\/admin$/,
          '/ocs/v1.php/cloud/groups/admin'
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', (data) => {
            data.appendElement('users', '', (users) => {
              users.appendElement('element', '', config.adminUsername)
            })
          })
        })
      })
    await provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.groups.getGroupMembers('admin').then(data => {
        expect(typeof (data)).toBe('object')
        expect(data.indexOf(config.adminUsername)).toBeGreaterThan(-1)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : deleteGroup with a non-existent group', async function () {
    await deleteGroupInteraction(provider, config.nonExistentGroup)
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
    const headers = { ...validAdminAuthHeaders, ...{ 'Content-Type': 'application/x-www-form-urlencoded' } }
    await provider
      .given('group does not exist', { groupName: config.testGroup })
      .uponReceiving('a create group POST request')
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
            return ocsMeta(meta, 'ok', '100')
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
    await deleteGroupInteraction(provider, config.testGroup)
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
