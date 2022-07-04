describe('Unauthenticated: Currently testing files management,', function () {
  // CURRENT TIME
  const timeRightNow = new Date().getTime()
  const OwnCloud = require('../../src')
  const { getMockServerBaseUrl } = require('../helpers/pactHelper.js')
  const mockServerBaseUrl = getMockServerBaseUrl()
  // LIBRARY INSTANCE
  let oc

  // TESTING CONFIGS
  const testContent = 'testContent'
  const testFolder = '/testFolder' + timeRightNow
  const testSubFiles = [
    testFolder + '/' + 'file one.txt',
    testFolder + '/' + 'zz+z.txt',
    testFolder + '/' + '中文.txt',
    testFolder + '/' + 'abc.txt',
    testFolder + '/' + 'subdir/in dir.txt'
  ]

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: mockServerBaseUrl
    })
  })

  it('checking method : list', function (done) {
    oc.files.list(testFolder, 1).then(files => {
      expect(files).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : getFileContents', function (done) {
    let count = 0

    for (let i = 0; i < testSubFiles.length; i++) {
      oc.files.getFileContents(testSubFiles[i]).then(content => {
        expect(content).toBe(null)
        done()
      }).catch(error => {
        expect(error).toBe('Please specify an authorization first.')
        count++
        if (count === testSubFiles.length) {
          done()
        }
      })
    }
  })

  it('checking method : putFileContents', function (done) {
    const newFile = testFolder + '/' + 'file.txt'

    oc.files.putFileContents(newFile, testContent).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : createFolder', function (done) {
    const newFolder = testFolder + '/' + 'new folder/'

    oc.files.createFolder(newFolder).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : delete', function (done) {
    const newFolder = testFolder + '/' + 'new folder'

    oc.files.delete(newFolder).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : getFile', function (done) {
    const file = 'tempFile' + timeRightNow

    oc.files.putFileContents(file, testContent).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : move', function (done) {
    oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })

  it('checking method : copy', function (done) {
    oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toBe('Please specify an authorization first.')
      done()
    })
  })
})
