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

module.exports = HTTPError
