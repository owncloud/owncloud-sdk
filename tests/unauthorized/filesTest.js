// TODO: Unskip the tests after the issue is fixed
// https://github.com/owncloud/owncloud-sdk/issues/705
import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing files management,', function () {
  const config = require('../config/config.json')
  var timeRightNow = new Date().getTime()

  // PACT setup
  const {
    accessControlAllowMethods,
    invalidAuthHeader,
    origin,
    webdavExceptionResponseBody,
    getCapabilitiesWithInvalidAuthInteraction,
    createOwncloud,
    createProvider
  } = require('../pactHelper.js')

  const requestHeaderWithInvalidAuth = {
    authorization: invalidAuthHeader
  }
  const expectedUnAuthorizedMessage = 'Username or password was incorrect, Username or password was incorrect'
  const incorrectAuthorizationXmlResponseBody = webdavExceptionResponseBody('NotAuthenticated', expectedUnAuthorizedMessage)
  const webdavFilesResponseHeader = {
    'Access-Control-Allow-Origin': origin,
    'Content-Type': 'application/xml; charset=utf-8',
    'Access-Control-Allow-Methods': accessControlAllowMethods
  }
  const unauthorizedResponse = {
    status: 401,
    headers: webdavFilesResponseHeader,
    body: incorrectAuthorizationXmlResponseBody
  }
  const webdavUrl = MatchersV3.regex(
    '.*\\/remote\\.php\\/webdav\\/.*',
    `/remote.php/webdav/${config.testFolder}`
  )

  const unauthorizedWebDavInteraction = (provider, method) => {
    return provider
      .uponReceiving(`a ${method} request on file contents with invalid authentication`)
      .withRequest({
        method: method,
        path: webdavUrl,
        headers: requestHeaderWithInvalidAuth
      })
      .willRespondWith(unauthorizedResponse)
  }

  // TESTING CONFIGS
  const testSubFiles = [
    config.testFolder + '/file one.txt',
    config.testFolder + '/zz+z.txt',
    config.testFolder + '/中文.txt',
    config.testFolder + '/abc.txt',
    config.testFolder + '/subdir/in dir.txt'
  ]

  it.skip('checking method : list', async function () {
    const provider = createProvider()
    await unauthorizedWebDavInteraction(provider, 'PROPFIND')
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.list(config.testFolder, 1).then(() => {
        fail()
      }).catch(error => {
        expect(error).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it.skip('checking method : getFileContents', async function () {
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'GET')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      for (let i = 0; i < testSubFiles.length; i++) {
        await oc.files.getFileContents(testSubFiles[i]).then(() => {
          fail()
        }).catch(error => {
          console.log(error)
          expect(error).toMatch(expectedUnAuthorizedMessage)
        })
      }
    })
  })

  it.skip('checking method : putFileContents', async function () {
    const newFile = config.testFolder + '/' + 'file.txt'
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'PUT')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.adminPassword + timeRightNow)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.putFileContents(newFile, config.testContent).then(() => {
        fail()
      }).catch(error => {
        expect(error).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it.skip('checking method : mkdir', async function () {
    const newFolder = config.testFolder + '/' + 'new folder/'
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'MKCOL')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.adminPassword + timeRightNow)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.mkdir(newFolder).then(() => {
        fail()
      }).catch(error => {
        expect(error).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it.skip('checking method : delete', async function () {
    const newFolder = config.testFolder + '/' + 'new folder'
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'DELETE')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.adminPassword + timeRightNow)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.delete(newFolder).then(() => {
        fail()
      }).catch(error => {
        expect(error).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it.skip('checking method : getFile', async function () {
    const file = 'tempFile'
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'PUT')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.adminPassword + timeRightNow)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.putFileContents(file, config.testContent).then(() => {
        fail()
      }).catch(error => {
        expect(error).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it.skip('checking method : move', async function () {
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'MOVE')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.adminPassword + timeRightNow)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.move(config.testFolder + '/中文.txt', config.testFolder + '/中文.txt').then(() => {
        fail()
      }).catch(error => {
        expect(error).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it.skip('checking method : copy', async function () {
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'COPY')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.adminPassword + timeRightNow)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.copy(config.testFolder + '/中文.txt', config.testFolder + '/中文.txt').then(() => {
        fail()
      }).catch(error => {
        expect(error).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })
})
