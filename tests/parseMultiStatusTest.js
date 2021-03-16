const { Dav } = require('../src/dav')
describe('Main: Currently testing XmlParser,', function () {
  const davClient = new Dav('http://localhost/core/remote.php/webdav', 'http://localhost/core/remote.php/dav')

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
    <d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:s="http://sabredav.org/ns">
      <d:response>
          <d:href>/remote.php/webdav/</d:href>
          <d:propstat>
            <d:prop>
                <oc:permissions>RDNVCK</oc:permissions>
                <oc:favorite>0</oc:favorite>
                <oc:fileid>3</oc:fileid>
                <oc:owner-id>admin</oc:owner-id>
                <oc:owner-display-name>admin</oc:owner-display-name>
                <oc:share-types />
                <oc:privatelink>http://localhost/index.php/f/3</oc:privatelink>
                <oc:size>385292</oc:size>
                <d:getlastmodified>Fri, 12 Feb 2021 10:49:45 GMT</d:getlastmodified>
                <d:getetag>"602a478aa2726"</d:getetag>
                <d:resourcetype>
                  <d:collection />
                </d:resourcetype>
            </d:prop>
            <d:status>HTTP/1.1 200 OK</d:status>
          </d:propstat>
          <d:propstat>
            <d:prop>
                <d:getcontentlength />
            </d:prop>
            <d:status>HTTP/1.1 404 Not Found</d:status>
          </d:propstat>
      </d:response>
      <d:response>
          <d:href>/remote.php/webdav/newFolder/</d:href>
          <d:propstat>
            <d:prop>
                <oc:permissions>RDNVCK</oc:permissions>
                <oc:favorite>0</oc:favorite>
                <oc:fileid>2147500913</oc:fileid>
                <oc:owner-id>admin</oc:owner-id>
                <oc:owner-display-name>admin</oc:owner-display-name>
                <oc:share-types>
                  <oc:share-type>0</oc:share-type>
                  <oc:share-type>3</oc:share-type>
                </oc:share-types>
                <oc:privatelink>http://localhost/index.php/f/2147500913</oc:privatelink>
                <oc:size>699</oc:size>
                <d:getlastmodified>Mon, 15 Feb 2021 10:06:02 GMT</d:getlastmodified>
                <d:getetag>"602a478aa2726"</d:getetag>
                <d:resourcetype>
                  <d:collection />
                </d:resourcetype>
            </d:prop>
            <d:status>HTTP/1.1 200 OK</d:status>
          </d:propstat>
          <d:propstat>
            <d:prop>
                <d:getcontentlength />
            </d:prop>
            <d:status>HTTP/1.1 404 Not Found</d:status>
          </d:propstat>
      </d:response>
      <d:response>
          <d:href>/remote.php/webdav/nf/</d:href>
          <d:propstat>
            <d:prop>
                <oc:permissions>RDNVCK</oc:permissions>
                <oc:favorite>0</oc:favorite>
                <oc:fileid>2147500892</oc:fileid>
                <oc:owner-id>admin</oc:owner-id>
                <oc:owner-display-name>admin</oc:owner-display-name>
                <oc:share-types>
                  <oc:share-type>3</oc:share-type>
                </oc:share-types>
                <oc:privatelink>http://localhost/index.php/f/2147500892</oc:privatelink>
                <oc:size>11</oc:size>
                <d:getlastmodified>Wed, 10 Feb 2021 12:31:35 GMT</d:getlastmodified>
                <d:getetag>"6023d2270b66a"</d:getetag>
                <d:resourcetype>
                  <d:collection />
                </d:resourcetype>
            </d:prop>
            <d:status>HTTP/1.1 200 OK</d:status>
          </d:propstat>
          <d:propstat>
            <d:prop>
                <d:getcontentlength />
            </d:prop>
            <d:status>HTTP/1.1 404 Not Found</d:status>
          </d:propstat>
      </d:response>
      <d:response>
          <d:href>/remote.php/webdav/testFolder/</d:href>
          <d:propstat>
            <d:prop>
                <oc:permissions>RDNVCK</oc:permissions>
                <oc:favorite>0</oc:favorite>
                <oc:fileid>2147500914</oc:fileid>
                <oc:owner-id>admin</oc:owner-id>
                <oc:owner-display-name>admin</oc:owner-display-name>
                <oc:share-types>
                  <oc:share-type>3</oc:share-type>
                </oc:share-types>
                <oc:privatelink>http://localhost/index.php/f/2147500914</oc:privatelink>
                <oc:size>0</oc:size>
                <d:getlastmodified>Thu, 11 Feb 2021 08:08:51 GMT</d:getlastmodified>
                <d:getetag>"6024e613d85a2"</d:getetag>
                <d:resourcetype>
                  <d:collection />
                </d:resourcetype>
            </d:prop>
            <d:status>HTTP/1.1 200 OK</d:status>
          </d:propstat>
          <d:propstat>
            <d:prop>
                <d:getcontentlength />
            </d:prop>
            <d:status>HTTP/1.1 404 Not Found</d:status>
          </d:propstat>
      </d:response>
      <d:response>
          <d:href>/remote.php/webdav/test_video.mp4</d:href>
          <d:propstat>
            <d:prop>
                <oc:permissions>RDNVW</oc:permissions>
                <oc:favorite>0</oc:favorite>
                <oc:fileid>2147500919</oc:fileid>
                <oc:owner-id>admin</oc:owner-id>
                <oc:owner-display-name>admin</oc:owner-display-name>
                <oc:share-types />
                <oc:privatelink>http://localhost/index.php/f/2147500919</oc:privatelink>
                <d:getcontentlength>383631</d:getcontentlength>
                <oc:size>383631</oc:size>
                <d:getlastmodified>Wed, 14 Oct 2020 07:53:01 GMT</d:getlastmodified>
                <d:getetag>"fe5117a087e9273e8a61f38d3f454d07"</d:getetag>
                <d:resourcetype />
            </d:prop>
            <d:status>HTTP/1.1 200 OK</d:status>
          </d:propstat>
      </d:response>
      <d:response>
          <d:href>/remote.php/webdav/welcome.txt</d:href>
          <d:propstat>
            <d:prop>
                <oc:permissions>RDNVW</oc:permissions>
                <oc:favorite>1</oc:favorite>
                <oc:fileid>2147490159</oc:fileid>
                <oc:owner-id>admin</oc:owner-id>
                <oc:owner-display-name>admin</oc:owner-display-name>
                <oc:share-types>
                  <oc:share-type>0</oc:share-type>
                </oc:share-types>
                <oc:privatelink>http://localhost/index.php/f/2147490159</oc:privatelink>
                <d:getcontentlength>64</d:getcontentlength>
                <oc:size>64</oc:size>
                <d:getlastmodified>Wed, 03 Feb 2021 09:43:16 GMT</d:getlastmodified>
                <d:getetag>"65af07a5d9f681d88e8864c8d7fa78a3"</d:getetag>
                <d:resourcetype />
            </d:prop>
            <d:status>HTTP/1.1 200 OK</d:status>
          </d:propstat>
      </d:response>
      <d:response>
          <d:href>/remote.php/webdav/zzzz-zzzz-will-be-at-the-end-of-the-folder-when-uploaded.txt</d:href>
          <d:propstat>
            <d:prop>
                <oc:permissions>RDNVW</oc:permissions>
                <oc:favorite>0</oc:favorite>
                <oc:fileid>2147500922</oc:fileid>
                <oc:owner-id>admin</oc:owner-id>
                <oc:owner-display-name>admin</oc:owner-display-name>
                <oc:share-types />
                <oc:privatelink>http://localhost/index.php/f/2147500922</oc:privatelink>
                <d:getcontentlength>887</d:getcontentlength>
                <oc:size>887</oc:size>
                <d:getlastmodified>Tue, 26 May 2020 08:48:55 GMT</d:getlastmodified>
                <d:getetag>"7fa7113843dbdcf2dc159dd3edcfa3c2"</d:getetag>
                <d:resourcetype />
            </d:prop>
            <d:status>HTTP/1.1 200 OK</d:status>
          </d:propstat>
      </d:response>
    </d:multistatus>`

  const parsedXml = [
    {
      href: '/remote.php/webdav/',
      propStat: [
        {
          status: 'HTTP/1.1 200 OK',
          properties: {
            '{http://owncloud.org/ns}permissions': 'RDNVCK',
            '{http://owncloud.org/ns}favorite': '0',
            '{http://owncloud.org/ns}fileid': '3',
            '{http://owncloud.org/ns}owner-id': 'admin',
            '{http://owncloud.org/ns}owner-display-name': 'admin',
            '{http://owncloud.org/ns}share-types': '',
            '{http://owncloud.org/ns}privatelink': 'http://localhost/index.php/f/3',
            '{http://owncloud.org/ns}size': '385292',
            '{DAV:}getlastmodified': 'Fri, 12 Feb 2021 10:49:45 GMT',
            '{DAV:}getetag': '"602a478aa2726"',
            '{DAV:}resourcetype': [
              '{DAV:}collection'
            ]
          }
        },
        {
          status: 'HTTP/1.1 404 Not Found',
          properties: {
            '{DAV:}getcontentlength': ''
          }
        }
      ]
    },
    {
      href: '/remote.php/webdav/newFolder/',
      propStat: [
        {
          status: 'HTTP/1.1 200 OK',
          properties: {
            '{http://owncloud.org/ns}permissions': 'RDNVCK',
            '{http://owncloud.org/ns}favorite': '0',
            '{http://owncloud.org/ns}fileid': '2147500913',
            '{http://owncloud.org/ns}owner-id': 'admin',
            '{http://owncloud.org/ns}owner-display-name': 'admin',
            '{http://owncloud.org/ns}share-types': [
              '0',
              '3'
            ],
            '{http://owncloud.org/ns}privatelink': 'http://localhost/index.php/f/2147500913',
            '{http://owncloud.org/ns}size': '699',
            '{DAV:}getlastmodified': 'Mon, 15 Feb 2021 10:06:02 GMT',
            '{DAV:}getetag': '"602a478aa2726"',
            '{DAV:}resourcetype': [
              '{DAV:}collection'
            ]
          }
        },
        {
          status: 'HTTP/1.1 404 Not Found',
          properties: {
            '{DAV:}getcontentlength': ''
          }
        }
      ]
    },
    {
      href: '/remote.php/webdav/nf/',
      propStat: [
        {
          status: 'HTTP/1.1 200 OK',
          properties: {
            '{http://owncloud.org/ns}permissions': 'RDNVCK',
            '{http://owncloud.org/ns}favorite': '0',
            '{http://owncloud.org/ns}fileid': '2147500892',
            '{http://owncloud.org/ns}owner-id': 'admin',
            '{http://owncloud.org/ns}owner-display-name': 'admin',
            '{http://owncloud.org/ns}share-types': [
              '3'
            ],
            '{http://owncloud.org/ns}privatelink': 'http://localhost/index.php/f/2147500892',
            '{http://owncloud.org/ns}size': '11',
            '{DAV:}getlastmodified': 'Wed, 10 Feb 2021 12:31:35 GMT',
            '{DAV:}getetag': '"6023d2270b66a"',
            '{DAV:}resourcetype': [
              '{DAV:}collection'
            ]
          }
        },
        {
          status: 'HTTP/1.1 404 Not Found',
          properties: {
            '{DAV:}getcontentlength': ''
          }
        }
      ]
    },
    {
      href: '/remote.php/webdav/testFolder/',
      propStat: [
        {
          status: 'HTTP/1.1 200 OK',
          properties: {
            '{http://owncloud.org/ns}permissions': 'RDNVCK',
            '{http://owncloud.org/ns}favorite': '0',
            '{http://owncloud.org/ns}fileid': '2147500914',
            '{http://owncloud.org/ns}owner-id': 'admin',
            '{http://owncloud.org/ns}owner-display-name': 'admin',
            '{http://owncloud.org/ns}share-types': [
              '3'
            ],
            '{http://owncloud.org/ns}privatelink': 'http://localhost/index.php/f/2147500914',
            '{http://owncloud.org/ns}size': '0',
            '{DAV:}getlastmodified': 'Thu, 11 Feb 2021 08:08:51 GMT',
            '{DAV:}getetag': '"6024e613d85a2"',
            '{DAV:}resourcetype': [
              '{DAV:}collection'
            ]
          }
        },
        {
          status: 'HTTP/1.1 404 Not Found',
          properties: {
            '{DAV:}getcontentlength': ''
          }
        }
      ]
    },
    {
      href: '/remote.php/webdav/test_video.mp4',
      propStat: [
        {
          status: 'HTTP/1.1 200 OK',
          properties: {
            '{http://owncloud.org/ns}permissions': 'RDNVW',
            '{http://owncloud.org/ns}favorite': '0',
            '{http://owncloud.org/ns}fileid': '2147500919',
            '{http://owncloud.org/ns}owner-id': 'admin',
            '{http://owncloud.org/ns}owner-display-name': 'admin',
            '{http://owncloud.org/ns}share-types': '',
            '{http://owncloud.org/ns}privatelink': 'http://localhost/index.php/f/2147500919',
            '{DAV:}getcontentlength': '383631',
            '{http://owncloud.org/ns}size': '383631',
            '{DAV:}getlastmodified': 'Wed, 14 Oct 2020 07:53:01 GMT',
            '{DAV:}getetag': '"fe5117a087e9273e8a61f38d3f454d07"',
            '{DAV:}resourcetype': ''
          }
        }
      ]
    },
    {
      href: '/remote.php/webdav/welcome.txt',
      propStat: [
        {
          status: 'HTTP/1.1 200 OK',
          properties: {
            '{http://owncloud.org/ns}permissions': 'RDNVW',
            '{http://owncloud.org/ns}favorite': '1',
            '{http://owncloud.org/ns}fileid': '2147490159',
            '{http://owncloud.org/ns}owner-id': 'admin',
            '{http://owncloud.org/ns}owner-display-name': 'admin',
            '{http://owncloud.org/ns}share-types': [
              '0'
            ],
            '{http://owncloud.org/ns}privatelink': 'http://localhost/index.php/f/2147490159',
            '{DAV:}getcontentlength': '64',
            '{http://owncloud.org/ns}size': '64',
            '{DAV:}getlastmodified': 'Wed, 03 Feb 2021 09:43:16 GMT',
            '{DAV:}getetag': '"65af07a5d9f681d88e8864c8d7fa78a3"',
            '{DAV:}resourcetype': ''
          }
        }
      ]
    },
    {
      href: '/remote.php/webdav/zzzz-zzzz-will-be-at-the-end-of-the-folder-when-uploaded.txt',
      propStat: [
        {
          status: 'HTTP/1.1 200 OK',
          properties: {
            '{http://owncloud.org/ns}permissions': 'RDNVW',
            '{http://owncloud.org/ns}favorite': '0',
            '{http://owncloud.org/ns}fileid': '2147500922',
            '{http://owncloud.org/ns}owner-id': 'admin',
            '{http://owncloud.org/ns}owner-display-name': 'admin',
            '{http://owncloud.org/ns}share-types': '',
            '{http://owncloud.org/ns}privatelink': 'http://localhost/index.php/f/2147500922',
            '{DAV:}getcontentlength': '887',
            '{http://owncloud.org/ns}size': '887',
            '{DAV:}getlastmodified': 'Tue, 26 May 2020 08:48:55 GMT',
            '{DAV:}getetag': '"7fa7113843dbdcf2dc159dd3edcfa3c2"',
            '{DAV:}resourcetype': ''
          }
        }
      ]
    }
  ]

  describe('testing parse XML', function () {
    it('tests parse multistatus XML', function () {
      const res = davClient.parseMultiStatus(sampleXml)
      expect(res).toEqual(parsedXml)
    })
  })
})
