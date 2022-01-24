/**
 * This file is generated code. It comes from https://github.com/owncloud/ocis/blob/master/settings/package.json#L17
 *
 * Since the ownCloud SDK doesn't use the global axios client directly but internally holds an instance with auth headers
 * already injected, we manually adapted the generated code to expect a client in the list of parameters. Please make
 * sure that these changes are manually applied if newly generated code needs to be checked in ever again (side note:
 * generated clients from protobuf/swagger are considered deprecated at ownCloud).
 */
/* eslint-disable */
import axios from 'axios'
import qs from 'qs'
let domain = ''
export const getDomain = () => {
  return domain
}
export const setDomain = ($domain) => {
  domain = $domain
}
export const request = (client, method, url, body, queryParameters, form, config) => {
  method = method.toLowerCase()
  let keys = Object.keys(queryParameters)
  let queryUrl = url
  if (keys.length > 0) {
    queryUrl = url + '?' + qs.stringify(queryParameters)
  }
  // let queryUrl = url+(keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '')
  if (body) {
    return client[method](queryUrl, body, config)
  } else if (method === 'get') {
    return client[method](queryUrl, config)
  } else {
    return client[method](queryUrl, qs.stringify(form), config)
  }
}
/*==========================================================
 *
 ==========================================================*/
/**
 *
 * request: ValueService_ListValues
 * url: ValueService_ListValuesURL
 * method: ValueService_ListValues_TYPE
 * raw_url: ValueService_ListValues_RAW_URL
 * @param parameters -
 */
export const ValueService_ListValues = function(parameters = {}) {
  const domain = parameters.$domain ? parameters.$domain : getDomain()
  const config = parameters.$config
  const client = parameters.client || axios
  let path = '/api/v0/settings/values-list'
  let body
  let queryParameters = {}
  let form = {}
  if (parameters['body'] !== undefined) {
    body = parameters['body']
  }
  if (parameters['body'] === undefined) {
    return Promise.reject(new Error('Missing required  parameter: body'))
  }
  if (parameters.$queryParameters) {
    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
      queryParameters[parameterName] = parameters.$queryParameters[parameterName]
    });
  }
  return request(client, 'post', domain + path, body, queryParameters, form, config)
}
export const ValueService_ListValues_RAW_URL = function() {
  return '/api/v0/settings/values-list'
}
export const ValueService_ListValues_TYPE = function() {
  return 'post'
}
export const ValueService_ListValuesURL = function(parameters = {}) {
  let queryParameters = {}
  const domain = parameters.$domain ? parameters.$domain : getDomain()
  let path = '/api/v0/settings/values-list'
  if (parameters.$queryParameters) {
    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
      queryParameters[parameterName] = parameters.$queryParameters[parameterName]
    })
  }
  let keys = Object.keys(queryParameters)
  return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '')
}
