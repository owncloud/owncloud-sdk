const SignUrl = require('../../src/owncloud-sign-url/src/signUrl')
const httpCodes = require('../../src/owncloud-sign-url/src/constants/httpCodes.constant')
const errorMessages = require('../../src/owncloud-sign-url/src/constants/errorMessages.constant')

const HTTP_GET_METHOD = 'get'
const HTTP_POST_METHOD = 'post'
const TEST_PORT = 33001

fdescribe('SignUrl tests', () => {
  let signUrl

  beforeAll(async () => {
    signUrl = new SignUrl({
      credential: 'user',
      secretKey: 'secretTest',
      ttl: 2,
      algorithm: 'sha256'
    })
  })

  describe('Ok tests', () => {
    it('should create signUrl with default params', async () => {
      const sign = new SignUrl({
        credential: 'user',
        secretKey: 'secr'
      })

      expect(sign).toBeTruthy()
    })

    it('should get OK', () => {
      const url = `http://localhost:${TEST_PORT}/try`

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD)
      const errorCode = signUrl.verifySignedUrl(signedUrl)
      expect(errorCode).toEqual(200)
    })

    it('should get OK (with custom route)', () => {
      const url = `http://localhost:${TEST_PORT}/customRoute/try`

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD)
      const errorCode = signUrl.verifySignedUrl(signedUrl)
      expect(errorCode).toEqual(200)
    })

    it('should get OK (with additional parameter)', () => {
      const url = `http://localhost:${TEST_PORT}/try?bbub=sdfsd`

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD)
      const errorCode = signUrl.verifySignedUrl(signedUrl)
      expect(errorCode).toEqual(200)
    })
  })

  describe('Error tests', () => {
    it('should throw error when "options" is not defined', () => {
      try {
        new SignUrl() // eslint-disable-line no-new
      } catch (err) {
        expect(err.message).toEqual(errorMessages.OPTIONS_UNDEFINED)
      }
    })

    it('should throw error when "credential" is not defined', () => {
      try {
        new SignUrl({}) // eslint-disable-line no-new
      } catch (err) {
        expect(err.message).toEqual(errorMessages.CREDENTIAL_UNDEFINED)
      }
    })

    it('should throw error when "secret key" is not defined', () => {
      try {
        new SignUrl({ credential: 'user' }) // eslint-disable-line no-new
      } catch (err) {
        expect(err.message).toEqual(errorMessages.SECRET_KEY_UNDEFINED)
      }
    })

    it('should throw error when "url" param is not defined', async () => {
      try {
        signUrl.generateSignedUrl(undefined, HTTP_GET_METHOD)
      } catch (err) {
        expect(err.message).toEqual(errorMessages.URL_PARAM_UNDEFINED)
      }
    })

    it('should throw error when "httpMethod" param is not defined', async () => {
      try {
        signUrl.generateSignedUrl('test', undefined)
      } catch (err) {
        expect(err.message).toEqual(errorMessages.HTTP_METHOD_PARAM_UNDEFINED)
      }
    })

    it('should throw error when "url" param ends with "/"', async () => {
      const url = `http://localhost:${TEST_PORT}/try/`

      try {
        signUrl.generateSignedUrl(url, HTTP_GET_METHOD)
      } catch (err) {
        expect(err.message).toEqual(errorMessages.URL_IS_NOT_VALID)
      }
    })

    it('should throw error when "OC-Signature" parameter is not defined', async () => {
      const url = `http://localhost:${TEST_PORT}/try/`
      const errorCode = signUrl.verifySignedUrl(url)
      expect(errorCode).toEqual(httpCodes.BAD_REQUEST)
    })

    it('should return 403 when token is not valid', async () => {
      const url = `http://localhost:${TEST_PORT}/try`

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD)
      const errorCode = signUrl.verifySignedUrl(signedUrl + '1')
      expect(errorCode).toEqual(httpCodes.FORBIDDEN)
    })

    it('should return 403 when httpMethod is different', async () => {
      const url = `http://localhost:${TEST_PORT}/try`

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD)
      const errorCode = signUrl.verifySignedUrl(signedUrl + '1', HTTP_POST_METHOD)
      expect(errorCode).toEqual(httpCodes.FORBIDDEN)
    })

    it('should return 410 when token expired', async () => {
      const url = `http://localhost:${TEST_PORT}/try`

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD)

      await new Promise(resolve => setTimeout(resolve, 3000))

      const errorCode = signUrl.verifySignedUrl(signedUrl)
      expect(errorCode).toEqual(httpCodes.EXPIRED)
    })
  })
})
