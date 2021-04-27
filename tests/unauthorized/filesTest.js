// [oCIS] HTTP 401 Unauthorized responses don't contain a body
// https://github.com/owncloud/ocis/issues/1293

import { MatchersV3 } from '@pact-foundation/pact/v3'

describe('Unauthorized: Currently testing files management,', function () {
  const config = require('../config/config.json')
  const username = config.adminUsername

  const {
    invalidAuthHeader,
    webdavExceptionResponseBody,
    getCapabilitiesWithInvalidAuthInteraction,
    createOwncloud,
    createProvider
  } = require('../helpers/pactHelper.js')

  const requestHeaderWithInvalidAuth = {
    authorization: invalidAuthHeader
  }

  // https://github.com/owncloud/core/issues/38530
  // Fix the error message once this issue is fixed
  const expectedUnAuthorizedMessage = 'Username or password was incorrect, Username or password was incorrect'
  const incorrectAuthorizationXmlResponseBody = webdavExceptionResponseBody('NotAuthenticated', expectedUnAuthorizedMessage)
  const webdavFilesResponseHeader = {
    'Content-Type': 'application/xml; charset=utf-8'
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

  const unauthorizedWebDavInteraction = (provider, requestName, method) => {
    return provider
      .uponReceiving(`as '${username}', a ${method} request to ${requestName} with invalid auth`)
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

  it('checking method : list', async function () {
    const provider = createProvider(true, true)
    await unauthorizedWebDavInteraction(provider, 'list folder contents', 'PROPFIND')
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
        expect(error.message).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it('checking method : getFileContents', async function () {
    const provider = createProvider(true, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'get file contents', 'GET')

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
          expect(error.message).toMatch(expectedUnAuthorizedMessage)
        })
      }
    })
  })

  it('checking method : putFileContents', async function () {
    const newFile = config.testFolder + '/' + 'file.txt'
    const provider = createProvider(true, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'update file contents', 'PUT')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.putFileContents(newFile, config.testContent).then(() => {
        fail()
      }).catch(error => {
        expect(error.message).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it('checking method : mkdir', async function () {
    const newFolder = config.testFolder + '/' + 'new folder/'
    const provider = createProvider(true, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'create a directory', 'MKCOL')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.mkdir(newFolder).then(() => {
        fail()
      }).catch(error => {
        expect(error.message).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it('checking method : delete', async function () {
    const newFolder = config.testFolder + '/' + 'new folder'
    const provider = createProvider(true, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'delete a folder', 'DELETE')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.delete(newFolder).then(() => {
        fail()
      }).catch(error => {
        expect(error.message).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it('checking method : move', async function () {
    const provider = createProvider(true, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'move a file', 'MOVE')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.move(config.testFolder + '/中文.txt', config.testFolder + '/中文.txt').then(() => {
        fail()
      }).catch(error => {
        expect(error.message).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it('checking method : copy', async function () {
    const provider = createProvider(true, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)
    await unauthorizedWebDavInteraction(provider, 'copy a file', 'COPY')

    return provider.executeTest(async () => {
      const oc = createOwncloud(config.adminUsername, config.invalidPassword)

      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.copy(config.testFolder + '/中文.txt', config.testFolder + '/中文.txt').then(() => {
        fail()
      }).catch(error => {
        expect(error.message).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })
})
