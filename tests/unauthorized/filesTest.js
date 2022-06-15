// [oCIS] HTTP 401 Unauthorized responses don't contain a body
// https://github.com/owncloud/ocis/issues/1293

describe('Unauthorized: Currently testing files management,', function () {
  const config = require('../config/config.json')
  const { admin: { username: adminUsername } } = require('../config/users.json')

  const {
    getCapabilitiesWithInvalidAuthInteraction,
    createOwncloud,
    createProvider
  } = require('../helpers/pactHelper.js')

  const expectedUnAuthorizedMessage = 'Username or password was incorrect'

  // TESTING CONFIGS
  const testSubFiles = [
    config.testFolder + '/file one.txt',
    config.testFolder + '/zz+z.txt',
    config.testFolder + '/中文.txt',
    config.testFolder + '/abc.txt',
    config.testFolder + '/subdir/in dir.txt'
  ]

  it('checking method : list', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
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
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
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
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
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

  it('checking method : createFolder', async function () {
    const newFolder = config.testFolder + '/' + 'new folder/'
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })
      return oc.files.createFolder(newFolder).then(() => {
        fail()
      }).catch(error => {
        expect(error.message).toMatch(expectedUnAuthorizedMessage)
      })
    })
  })

  it('checking method : delete', async function () {
    const newFolder = config.testFolder + '/' + 'new folder'
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
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
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)

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
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)

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
