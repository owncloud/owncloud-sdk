fdescribe('Main: Currently testing file versions management,', function () {
  const OwnCloud = require('../src/owncloud')
  const config = require('./config/config.json')

  // LIBRARY INSTANCE
  let oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const {
    setGeneralInteractions,
    validAuthHeaders,
    accessControlAllowHeaders,
    accessControlAllowMethods,
    applicationXmlResponseHeaders,
    getContentsOfFile
  } = require('./pactHelper.js')

  // TESTING CONFIGS
  const versionedFile = config.testFile
  const fileInfo = {
    id: 12345678,
    versions: [
      {
        versionId: 98765432,
        content: config.testContent
      },
      {
        versionId: 87654321,
        content: '*'
      }
    ]
  }
  const propfindFileVersionsRequestData = {
    method: 'PROPFIND',
    path: Pact.Matchers.regex({
      matcher: `.*\\/remote\\.php\\/dav\\/meta\\/${fileInfo.id}\\/v$`,
      generate: `/remote.php/dav/meta/${fileInfo.id}/v`
    }),
    headers: validAuthHeaders,
    body: '<?xml version="1.0"?>\n' +
      '<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">\n' +
      '  <d:prop>\n' +
      '  </d:prop>\n' +
      '</d:propfind>'
  }

  const header = {
    ...applicationXmlResponseHeaders,
    'Access-Control-Allow-Headers': accessControlAllowHeaders,
    'Access-Control-Allow-Methods': accessControlAllowMethods
  }

  const propfindFileVersionsResponse = (version, contentLength) => {
    return '    <d:response>\n' +
            `        <d:href>/remote.php/dav/meta/${fileInfo.id}/v/${fileInfo.versions[version].versionId}</d:href>\n` +
            '        <d:propstat>\n' +
            '            <d:prop>\n' +
            '                <d:getlastmodified>Thu, 08 Oct 2020 02:28:50 GMT</d:getlastmodified>\n' +
            `                <d:getcontentlength>${contentLength}</d:getcontentlength>\n` +
            '                <d:resourcetype/>\n' +
            '                <d:getetag>&quot;bc7012325dcc9899be7da7cabfdddb00&quot;</d:getetag>\n' +
            '                <d:getcontenttype>text/plain</d:getcontenttype>\n' +
            '            </d:prop>\n' +
            '            <d:status>HTTP/1.1 200 OK</d:status>\n' +
            '        </d:propstat>\n' +
            '        <d:propstat>\n' +
            '            <d:prop>\n' +
            '                <d:quota-used-bytes/>\n' +
            '                <d:quota-available-bytes/>\n' +
            '            </d:prop>\n' +
            '            <d:status>HTTP/1.1 404 Not Found</d:status>\n' +
            '        </d:propstat>\n' +
            '    </d:response>\n'
  }

  const fileVersionPath = version => Pact.Matchers.regex({
    matcher: `.*\\/remote\\.php\\/dav\\/meta\\/${fileInfo.id}\\/v\\/${fileInfo.versions[version].versionId}$`,
    generate: `/remote.php/dav/meta/${fileInfo.id}/v/${fileInfo.versions[version].versionId}`
  })

  beforeEach(function (done) {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password
        }
      }
    })

    oc.login().then(status => {
      expect(status).toEqual({ id: 'admin', 'display-name': 'admin', email: {} })
      done()
    }).catch(error => {
      expect(error).toBe(null)
      done()
    })
  })
  afterEach(function () {
    oc.logout()
    oc = null
  })

  describe('file versions of non existing file', () => {
    beforeAll(done => {
      const promises = []
      promises.push(setGeneralInteractions(provider))
      promises.push(provider.addInteraction({
        uponReceiving: 'PROPFIND file versions of non existent file',
        withRequest: propfindFileVersionsRequestData,
        willRespondWith: {
          status: 404,
          headers: applicationXmlResponseHeaders,
          body: '<?xml version="1.0" encoding="utf-8"?>\n' +
            '<d:error xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns">\n' +
            '  <s:exception>Sabre\\DAV\\Exception\\NotFound</s:exception>\n' +
            '  <s:message/>\n' +
            '</d:error>'
        }
      }))

      Promise.all(promises).then(done, done.fail)
    })

    afterAll(function (done) {
      provider.removeInteractions().then(done, done.fail)
    })
    it('retrieves file versions of not existing file', function (done) {
      oc.fileVersions.listVersions(fileInfo.id).then(versions => {
        expect(versions).toBe(null)
        done()
      }).catch(error => {
        expect(error.statusCode).toBe(404)
        expect(error.message).toBe('')
        done()
      })
    })
  })

  describe('file versions for existing files', () => {
    beforeAll(done => {
      const promises = []
      promises.push(setGeneralInteractions(provider))
      promises.push(provider.addInteraction({
        uponReceiving: 'PROPFIND file versions of existent file',
        withRequest: propfindFileVersionsRequestData,
        willRespondWith: {
          status: 207,
          headers: header,
          body: '<?xml version="1.0"?>\n' +
            '<d:multistatus\n' +
            '    xmlns:d="DAV:"\n' +
            '    xmlns:s="http://sabredav.org/ns"\n' +
            '    xmlns:oc="http://owncloud.org/ns">\n' +
            '    <d:response>\n' +
            `        <d:href>/remote.php/dav/meta/${fileInfo.id}/v/</d:href>\n` +
            '        <d:propstat>\n' +
            '            <d:prop>\n' +
            '                <d:resourcetype>\n' +
            '                    <d:collection/>\n' +
            '                </d:resourcetype>\n' +
            '            </d:prop>\n' +
            '            <d:status>HTTP/1.1 200 OK</d:status>\n' +
            '        </d:propstat>\n' +
            '    </d:response>\n' +
            `${propfindFileVersionsResponse(1, 2)}` +
            `${propfindFileVersionsResponse(0, 1)}` +
            '</d:multistatus>'
        }
      }))

      for (let i = 0; i < fileInfo.versions.length; i++) {
        promises.push(provider.addInteraction({
          uponReceiving: 'GET file version contents',
          withRequest: {
            method: 'GET',
            path: fileVersionPath(i),
            headers: validAuthHeaders
          },
          willRespondWith: {
            status: 200,
            headers: header,
            body: fileInfo.versions[i].content
          }
        }))
      }

      promises.push(provider.addInteraction({
        uponReceiving: 'Restore file versions',
        withRequest: {
          method: 'COPY',
          path: fileVersionPath(0),
          headers: validAuthHeaders
        },
        willRespondWith: {
          status: 204,
          headers: header
        }
      }))

      Promise.all(promises).then(done, done.fail)
    })

    afterAll(function (done) {
      provider.removeInteractions().then(done, done.fail)
    })

    it('checking method: getFileVersionUrl', function () {
      const url = oc.fileVersions.getFileVersionUrl(666, 123456)
      expect(url).toBe(config.owncloudURL + 'remote.php/dav/meta/666/v/123456')
    })

    it('retrieves file versions', async function (done) {
      oc.fileVersions.listVersions(fileInfo.id).then(versions => {
        expect(versions.length).toEqual(2)
        expect(versions[0].getSize()).toEqual(2)
        expect(versions[1].getSize()).toEqual(1)
        oc.fileVersions.getFileVersionContents(fileInfo.id, fileInfo.versions[0].versionId).then(content => {
          expect(content).toBe(fileInfo.versions[0].content)
          oc.fileVersions.getFileVersionContents(fileInfo.id, fileInfo.versions[1].versionId).then(content => {
            expect(content).toBe(fileInfo.versions[1].content)
            done()
          })
        })
      })
    })

    it('restore file version', async function (done) {
      await provider.addInteraction(getContentsOfFile(versionedFile))
      oc.fileVersions.listVersions(fileInfo.id).then(versions => {
        expect(versions.length).toEqual(2)
        expect(versions[0].getSize()).toEqual(2)
        expect(versions[1].getSize()).toEqual(1)
        oc.fileVersions.restoreFileVersion(fileInfo.id, fileInfo.versions[0].versionId, versionedFile).then(status => {
          expect(status).toBe(true)
          oc.files.getFileContents(versionedFile).then(content => {
            expect(content).toBe(fileInfo.versions[0].content)
            done()
          })
        }).catch(reason => {
          fail(reason)
          done()
        })
      })
    })
  })
})
