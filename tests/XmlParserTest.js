describe('Main: Currently testing XmlParser,', function () {
  var parser = require('../src/xmlParser.js').xml2js

  var sampleXml1 =
        '<cont:contact xmlns:cont = "www.tutorialspoint.com/profile">' +
        '   <cont:name>Tanmay Patil</cont:name>' +
        '   <cont:company>TutorialsPoint</cont:company>' +
        '   <cont:phone>(011) 123-4567</cont:phone>' +
        '</cont:contact>'
  var sampleNS1 = {
    cont: 'www.tutorialspoint.com/profile'
  }
  var parsedXml1 = {
    '{www.tutorialspoint.com/profile}contact': {
      _attributes: {
        'xmlns:cont': 'www.tutorialspoint.com/profile'
      },
      '{www.tutorialspoint.com/profile}name': 'Tanmay Patil',
      '{www.tutorialspoint.com/profile}company': 'TutorialsPoint',
      '{www.tutorialspoint.com/profile}phone': '(011) 123-4567'
    }
  }

  var sampleXml2 =
        '<d:response>' +
        '    <d:href>/core/remote.php/webdav/</d:href>' +
        '    <d:propstat>' +
        '        <d:prop>' +
        '            <s:getlastmodified>Mon, 26 Jun 2017 08:57:43 GMT</s:getlastmodified>               ' +
        '            <oc:resourcetype><d:collection/></oc:resourcetype>' +
        '            <s:quota-used-bytes>3</s:quota-used-bytes>' +
        '            <oc:quota-available-bytes>-3</oc:quota-available-bytes>' +
        '            <d:getetag>&quot;5950cc87e601e&quot;</d:getetag>' +
        '            <x:customtag>customvalue</x:customtag>' +
        '        </d:prop>' +
        '        <d:status>HTTP/1.1 200 OK</d:status>' +
        '    </d:propstat>' +
        '</d:response>'
  var sampleNS2 = {
    d: 'DAV:',
    s: 'http://sabredav.org/ns',
    oc: 'http://owncloud.org/ns',
    x: 'customns'
  }
  var parsedXml2 = {
    '{DAV:}response': {
      '{DAV:}href': '/core/remote.php/webdav/',
      '{DAV:}propstat': {
        '{DAV:}prop': {
          '{customns}customtag': 'customvalue',
          '{http://sabredav.org/ns}getlastmodified': 'Mon, 26 Jun 2017 08:57:43 GMT',
          '{http://sabredav.org/ns}quota-used-bytes': '3',
          '{http://owncloud.org/ns}resourcetype': {
            '{DAV:}collection': {}
          },
          '{http://owncloud.org/ns}quota-available-bytes': '-3',
          '{DAV:}getetag': '"5950cc87e601e"'
        },
        '{DAV:}status': 'HTTP/1.1 200 OK'
      }
    }
  }

  describe('testing 1st XML', function () {
    it('tests XML', function () {
      var parsedXml = parser(sampleXml1, sampleNS1)
      expect(parsedXml).toEqual(parsedXml1)
    })
  })

  describe('testing 2nd XML', function () {
    it('tests XML', function () {
      var parsedXml = parser(sampleXml2, sampleNS2)
      expect(parsedXml).toEqual(parsedXml2)
    })
  })
})
