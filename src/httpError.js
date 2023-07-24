/**
 * @class HttpError
 * @classdesc A error class for Http errors
 * @param   {number}    code     http status code
 * @param   {string}    message  optional message to be added to the HTTPError
 */

class HTTPError extends Error {
  constructor (response, code, message = null) {
    super(message)
    this.statusCode = code
    this.response = response
  }
}

module.exports = HTTPError
