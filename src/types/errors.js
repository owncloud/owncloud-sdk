class ClientError extends Error {
  constructor (message, code = -1) {
    super(message)
    this.name = 'ClientError'
    this.code = code
  }
}

class NotFoundError extends Error {
  constructor (request) {
    super('Not found')
    this.name = 'NotFoundError'
    this.request = request
  }
}

/**
 * @class HttpError
 * @classdesc A error class for Http errors
 * @param   {number}    code     http status code
 * @param   {string}    message  optional message to be added to the HTTPError
 */

class HTTPError extends Error {
  constructor (code, message = null) {
    super(message)
    this.statusCode = code
  }
}

module.exports = { ClientError, NotFoundError, HTTPError }
