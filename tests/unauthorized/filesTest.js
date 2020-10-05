fdescribe('Unauthorized: Currently testing files management,', function () {
  const OwnCloud = require('../../src')
  const config = require('../config/config.json')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const { setGeneralInteractions, invalidAuthHeader, origin } = require('../pactHelper.js')
  const provider = new Pact.PactWeb()
  const requestHeaderWithInvalidAuth = {
    authorization: invalidAuthHeader,
    Origin: origin
  }
  const expectedUnAuthorizedMessage = 'Username or password was incorrect, Username or password was incorrect'
  const incorrectAuthorizationXmlResponseBody = '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<d:error xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns">\n' +
    '  <s:exception>Sabre\\DAV\\Exception\\NotAuthenticated</s:exception>\n' +
    '  <s:message>Username or password was incorrect, Username or password was incorrect</s:message>\n' +
    '</d:error>'
  const webdavFilesResponseHeader = {
    'Access-Control-Allow-Origin': origin,
    'Content-Type': 'application/xml; charset=utf-8',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT,HEAD,COPY,MOVE'
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

  beforeAll(function (done) {
    const promises = []
    promises.push(setGeneralInteractions(provider))
    promises.push(provider.addInteraction({
      uponReceiving: 'a request to get file contents with invalid authentication',
      withRequest: {
        method: 'GET',
        path: webdavUrl,
        headers: requestHeaderWithInvalidAuth
      },
      willRespondWith: unauthorizedResponse
    }))
    promises.push(provider.addInteraction({
      uponReceiving: 'a request to put file contents with invalid authentication',
      withRequest: {
        method: 'PUT',
        path: webdavUrl,
        headers: requestHeaderWithInvalidAuth
      },
      willRespondWith: unauthorizedResponse
    }))
    promises.push(provider.addInteraction({
      uponReceiving: 'a request to delete file contents with invalid authentication',
      withRequest: {
        method: 'DELETE',
        path: webdavUrl,
        headers: requestHeaderWithInvalidAuth
      },
      willRespondWith: unauthorizedResponse
    }))
    promises.push(provider.addInteraction({
      uponReceiving: 'a request to create a directory with invalid authentication',
      withRequest: {
        method: 'MKCOL',
        path: webdavUrl,
        headers: {
          authorization: invalidAuthHeader,
          Origin: origin
        }
      },
      willRespondWith: {
        status: 401,
        headers: webdavFilesResponseHeader,
        body: incorrectAuthorizationXmlResponseBody
      }
    }))
    promises.push(provider.addInteraction({
      uponReceiving: 'a request to list files with invalid authentication',
      withRequest: {
        method: 'PROPFIND',
        path: webdavUrl,
        headers: requestHeaderWithInvalidAuth
      },
      willRespondWith: unauthorizedResponse
    }))
    promises.push(provider.addInteraction({
      uponReceiving: 'a request to move file with invalid authentication',
      withRequest: {
        method: 'MOVE',
        path: webdavUrl,
        headers: requestHeaderWithInvalidAuth
      },
      willRespondWith: unauthorizedResponse
    }))
    promises.push(provider.addInteraction({
      uponReceiving: 'a request to copy a file with invalid authentication',
      withRequest: {
        method: 'COPY',
        path: webdavUrl,
        headers: requestHeaderWithInvalidAuth
      },
      willRespondWith: unauthorizedResponse
    }))

    Promise.all(promises).then(done, done.fail)
  })

  afterAll(function (done) {
    provider.removeInteractions().then(done, done.fail)
  })

  // TESTING CONFIGS
  const testContent = config.testContent
  const testFolder = config.testFolder
  const testSubFiles = [
    testFolder + '/file one.txt',
    testFolder + '/zz+z.txt',
    testFolder + '/中文.txt',
    testFolder + '/abc.txt',
    testFolder + '/subdir/in dir.txt'
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

    oc.login()
  })

  fit('checking method : list', function (done) {
    oc.files.list(testFolder, 1).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  fit('checking method : getFileContents', function (done) {
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

  fit('checking method : putFileContents', function (done) {
    const newFile = testFolder + '/' + 'file.txt'

    oc.files.putFileContents(newFile, testContent).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  fit('checking method : mkdir', function (done) {
    const newFolder = testFolder + '/' + 'new folder/'

    oc.files.mkdir(newFolder).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  fit('checking method : delete', function (done) {
    const newFolder = testFolder + '/' + 'new folder'

    oc.files.mkdir(newFolder).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  fit('checking method : getFile', function (done) {
    const file = 'tempFile'

    oc.files.putFileContents(file, testContent).then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  fit('checking method : move', function (done) {
    oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })

  fit('checking method : copy', function (done) {
    oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(() => {
      fail()
      done()
    }).catch(error => {
      expect(error).toMatch(expectedUnAuthorizedMessage)
      done()
    })
  })
})
