const { Dav } = require('../src/dav')
describe('Main: Currently testing XmlParser,', function () {
  const davClient = new Dav('http://localhost/core/remote.php/dav')

  const testData = [
    [{ clarkNotation: 'invalid' }, false],
    [{ clarkNotation: '{}invalid' }, false],
    [{ clarkNotation: '42' }, false],
    [{ clarkNotation: 'true' }, false],
    [{ clarkNotation: 'false' }, false],
    [{ clarkNotation: '{http://owncloud.org/ns}permissions', expectedResult: { name: 'permissions', namespace: 'http://owncloud.org/ns' } }, true],
    [{ clarkNotation: '{http://owncloud.org/ns}favorite', expectedResult: { name: 'favorite', namespace: 'http://owncloud.org/ns' } }, true],
    [{ clarkNotation: '{http://owncloud.org/ns}fileid', expectedResult: { name: 'fileid', namespace: 'http://owncloud.org/ns' } }, true],
    [{ clarkNotation: '{http://owncloud.org/ns}owner-id', expectedResult: { name: 'owner-id', namespace: 'http://owncloud.org/ns' } }, true],
    [{ clarkNotation: '{http://owncloud.org/ns}owner-display-name', expectedResult: { name: 'owner-display-name', namespace: 'http://owncloud.org/ns' } }, true],
    [{ clarkNotation: '{http://owncloud.org/ns}share-types', expectedResult: { name: 'share-types', namespace: 'http://owncloud.org/ns' } }, true],
    [{ clarkNotation: '{http://owncloud.org/ns}privatelink', expectedResult: { name: 'privatelink', namespace: 'http://owncloud.org/ns' } }, true],
    [{ clarkNotation: '{DAV:}getcontentlength', expectedResult: { name: 'getcontentlength', namespace: 'DAV:' } }, true],
    [{ clarkNotation: '{http://owncloud.org/ns}size', expectedResult: { name: 'size', namespace: 'http://owncloud.org/ns' } }, true],
    [{ clarkNotation: '{DAV:}getlastmodified', expectedResult: { name: 'getlastmodified', namespace: 'DAV:' } }, true],
    [{ clarkNotation: '{DAV:}getetag', expectedResult: { name: 'getetag', namespace: 'DAV:' } }, true],
    [{ clarkNotation: '{DAV:}resourcetype', expectedResult: { name: 'resourcetype', namespace: 'DAV:' } }, true]
  ]
  describe('testing parse clark notation', function () {
    it.each(testData)('tests parse clark notation', function (data, expected) {
      const res = davClient.parseClarkNotation(data.clarkNotation)
      if (expected) {
        expect(res).toStrictEqual(data.expectedResult)
      } else {
        expect(res).toBe(undefined)
      }
    })
  })
})
