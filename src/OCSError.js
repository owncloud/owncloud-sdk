/**
 * @class OCSError
 * @classdesc A error class for OCS errors
 * @param   {string}  message   message to be added to the OCSError
 * @param   {number}  statusCode  statusCode to be added to the OCSError
 * @param   {object}  response  http response
 * @param   {object}  ocs       ocs additional data

 */

class OCSError extends Error {
  constructor (message, statusCode, response, ocs = null) {
    super(message)
    this.statusCode = statusCode
    this.response = response
    this.ocs = ocs
  }
}

module.exports = OCSError
