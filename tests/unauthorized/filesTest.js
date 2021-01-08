describe('Unauthorized: Currently testing files management,', function () {
  const OwnCloud = require('../../src')
  const config = require('../config/config.json')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const {
    accessControlAllowMethods,
    invalidAuthHeader,
    origin,
    webdavExceptionResponseBody,
    CORSPreflightRequest,
    capabilitiesGETRequestInvalidAuth,
    pactCleanup
  } = require('../pactHelper.js')

  const provider = new Pact.PactWeb()
  const requestHeaderWithInvalidAuth = {
    authorization: invalidAuthHeader,
    Origin: origin
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
  const webdavUrl = Pact.Matchers.regex({
    matcher: '.*\\/remote\\.php\\/webdav\\/.*',
    generate: `/remote.php/webdav/${config.testFolder}`
  })

  beforeAll(function () {
    const promises = []
    promises.push(provider.addInteraction(CORSPreflightRequest()))
    promises.push(provider.addInteraction(capabilitiesGETRequestInvalidAuth()))
    const requiredMethodsForUnauthorizedTest = ['GET', 'PUT', 'MKCOL', 'DELETE', 'COPY', 'MOVE', 'PROPFIND']
    requiredMethodsForUnauthorizedTest.forEach((method) => {
      promises.push(provider.addInteraction({
        uponReceiving: `a ${method} request on file contents with invalid authentication`,
        withRequest: {
          method: method,
          path: webdavUrl,
          headers: requestHeaderWithInvalidAuth
        },
        willRespondWith: unauthorizedResponse
      }))
    })

    return Promise.all(promises)
  })

  afterAll(function () {
    return pactCleanup(provider)
  })

  // TESTING CONFIGS
  const testSubFiles = [
    config.testFolder + '/file one.txt',
    config.testFolder + '/zz+z.txt',
    config.testFolder + '/中文.txt',
    config.testFolder + '/abc.txt',
    config.testFolder + '/subdir/in dir.txt'
  ]

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password + new Date().getTime()
        }
      }
    })

    return oc.login().then(() => {
      fail('not expected to log in')
    }).catch((err) => {
      if (err !== 'Unauthorized') {
        throw new Error(err)
      }
    })
  })

  it('checking method : list', function (done) {
    oc.files.list(config.testFolder, 1).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  it('checking method : getFileContents', function (done) {
    let count = 0

    for (let i = 0; i < testSubFiles.length; i++) {
      oc.files.getFileContents(testSubFiles[i]).then(() => {
        fail()
        done()
      }).catch(error => {
        expect(error).toMatch(expectedUnAuthorizedMessage)
        count++
        if (count === testSubFiles.length) {
          done()
        }
      })
    }
  })

  it('checking method : putFileContents', function (done) {
    const newFile = config.testFolder + '/' + 'file.txt'

    oc.files.putFileContents(newFile, config.testContent).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  it('checking method : mkdir', function (done) {
    const newFolder = config.testFolder + '/' + 'new folder/'

    oc.files.mkdir(newFolder).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  it('checking method : delete', function (done) {
    const newFolder = config.testFolder + '/' + 'new folder'

    oc.files.delete(newFolder).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  it('checking method : getFile', function (done) {
    const file = 'tempFile'

    oc.files.putFileContents(file, config.testContent).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  it('checking method : move', function (done) {
    oc.files.move(config.testFolder + '/中文.txt', config.testFolder + '/中文.txt').then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  it('checking method : copy', function (done) {
    oc.files.copy(config.testFolder + '/中文.txt', config.testFolder + '/中文.txt').then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })
})
