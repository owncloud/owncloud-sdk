const Promise = require('promise')
const { GatewayServiceClient, AuthenticateRequest } = require('cs3apis/cs3/gateway/v0alpha/gateway_grpc_web_pb')
const { Code } = require('cs3apis/cs3/rpc/code_pb')
const { ClientError, NotFoundError } = require('../types/errors')

class Reva {
  constructor (options) {
    // console.log('this is reva', options)

    if ('auth' in options && 'connector' in options) {
      this.grpcProxy = options.connector.server
      this.clientId = options.connector.clientId
      this.clientSecret = options.auth.bearer
      this.internalCLient = new GatewayServiceClient(this.grpcProxy, {}, {})
      this._authenticate()
    }
  }

  _authenticate () {
    let authRequest = new AuthenticateRequest()
    authRequest.setType('bearer')
    authRequest.setClientId(this.clientId)
    authRequest.setClientSecret(this.clientSecret)

    this.accessToken = new Promise((resolve, reject) => {
      this.internalCLient.authenticate(authRequest, {}, (err, response) => {
        if (!err && response.getStatus().getCode() === Code.CODE_OK) {
          resolve(response.getToken())
        } else {
          reject()
        }
      })
    })
  }

  async getClient () {
    if (!this.accessToken) {
      return Promise.reject('Please specify an authorization first.')
    } else {
      let accessToken = await this.accessToken
      // Every call to the client needs to add the access token.
      // We intercepting the call here to add the token, instead of doing it everywhere.
      // We take the chance and also wrap the error handling.
      return new Proxy(this.internalCLient, {
        get: function (target, prop) {
          if (target[prop] !== undefined) {
            return function () {
              return new Promise((resolve, reject) => {
                let request = arguments[0]
                let successFunction = arguments[1]
                let metadata = { 'x-access-token': accessToken }
                let callback = (err, response) => {
                  if (err || response.getStatus().getCode() !== Code.CODE_OK) {
                    if (err) {
                      return reject(new ClientError(err))
                    } else if (response.getStatus().getCode() === Code.CODE_NOT_FOUND) {
                      return reject(new NotFoundError(request))
                    } else {
                      return reject(new ClientError(response.getStatus().getMessage(), response.getStatus().getCode()))
                    }
                  }
                  return resolve(successFunction(response))
                }
                target[prop](request, metadata, callback)
              })
            }
          }
        }
      })
    }
  }
}

module.exports = Reva
