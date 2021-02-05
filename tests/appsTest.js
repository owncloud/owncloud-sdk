import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing apps management,', function () {
  const nonExistentApp = 'nonExistentApp123'

  // PACT setup
  const {
    validAdminAuthHeaders,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    xmlResponseHeaders,
    htmlResponseHeaders,
    createProvider,
    createOwncloud
  } = require('./pactHelper.js')

  const changeAppStatus = (provider, action) => {
    let method = 'DELETE'
    let responseHeader = htmlResponseHeaders
    let body = ''
    if (action === 'enable') {
      method = 'POST'
      responseHeader = xmlResponseHeaders
      body = new XmlBuilder('1.0', '', 'ocs').build(ocs => {
        ocs.appendElement('meta', '', (meta) => {
          meta
            .appendElement('status', '', 'ok')
            .appendElement('statuscode', '', 100)
            .appendElement('message', '', '')
        }).appendElement('data', '', '')
      })
    }
    return provider
      .uponReceiving(action + ' apps')
      .withRequest({
        method,
        path: MatchersV3.regex(
          /.*\/ocs\/v1\.php\/cloud\/apps\/.+$/,
          '/ocs/v1.php/cloud/apps/files'
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: responseHeader,
        body: body
      })
  }

  const getAppsInteraction = (provider, query) => {
    return provider
      .uponReceiving('a GET request for a list of apps')
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          /.*\/ocs\/v1\.php\/cloud\/apps$/,
          '/ocs/v1.php/cloud/apps'
        ),
        query: query,
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            meta
              .appendElement('status', '', 'ok')
              .appendElement('statuscode', '', 100)
              .appendElement('message', '', '')
          }).appendElement('data', '', (data) => {
            data.appendElement('apps', '', (apps) => {
              apps
                .appendElement('element', '', MatchersV3.string('workflow'))
                .appendElement('element', '', MatchersV3.string('files'))
            })
          })
        })
      })
  }

  it('checking method : getApps', async () => {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getAppsInteraction(provider, { filter: 'enabled' })
    await getAppsInteraction(provider, {})

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.apps.getApps().then(apps => {
        expect(apps).not.toBe(null)
        expect(typeof (apps)).toBe('object')
        expect(apps.files).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : enableApp when app exists', async function () {
    const provider = createProvider()
    await changeAppStatus(provider, 'enable')
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.apps.enableApp('files').then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  // cors issue
  it('checking method : disableApp when app exists', async function () {
    const provider = createProvider()
    await changeAppStatus(provider, 'disable')
    await changeAppStatus(provider, 'enable')
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.apps.disableApp('files').then(status => {
        expect(status).toBe(true)

        // Re-Enabling the Files App
        return oc.apps.enableApp('files')
      }).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : enableApp when app doesn\'t exist', async function () {
    const provider = createProvider()
    await changeAppStatus(provider, 'enable')
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.apps.enableApp(nonExistentApp).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        console.log(error)
        expect(error).toEqual('No app found by the name "' + nonExistentApp + '"')
      })
    })
  })

  it('checking method : disableApp when app doesn\'t exist', async function () {
    const provider = createProvider()
    await changeAppStatus(provider, 'disable')
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.apps.disableApp(nonExistentApp).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })
})
