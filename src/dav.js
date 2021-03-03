const { createClient } = require('webdav')
const parser = require('./xmlParser.js')

export class Dav {
  constructor (baseUrl, baseUrlv2) {
    this._XML_CHAR_MAP = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;'
    }

    this.baseUrl = baseUrl

    this.userName = null

    this.password = null

    this.xmlNamespaces = {
      'DAV:': 'd',
      'http://owncloud.org/ns': 'oc'
    }

    this.xmlNamespacesComponents = {
      d: 'DAV:',
      oc: 'http://owncloud.org/ns'
    }

    this.client = createClient(baseUrl, {})
    this.clientv2 = createClient(baseUrlv2, {})
  }

  _escapeXml (s) {
    return s.replace(/[<>&"']/g, function (ch) {
      return this._XML_CHAR_MAP[ch]
    })
  };

  /**
   * Generates a propFind request.
   *
   * @param {string} url Url to do the propfind request on
   * @param {Array} properties List of properties to retrieve.
   * @param {string} depth "0", "1" or "infinity"
   * @param {Object} [headers] headers
   * @return {Promise}
   */
  propFind (path, properties, depth, headers, options = {}) {
    if (typeof depth === 'undefined') {
      depth = '0'
    }

    // depth header must be a string, in case a number was passed in
    depth = '' + depth

    headers = headers || {}

    headers.Depth = depth
    headers['Content-Type'] = 'application/xml; charset=utf-8'

    var body =
          '<?xml version="1.0"?>\n' +
          '<d:propfind '
    var namespace
    for (namespace in this.xmlNamespaces) {
      body += ' xmlns:' + this.xmlNamespaces[namespace] + '="' + namespace + '"'
    }
    body += '>\n' +
          '  <d:prop>\n'

    for (var ii in properties) {
      // eslint-disable-next-line no-prototype-builtins
      if (!properties.hasOwnProperty(ii)) {
        continue
      }

      var property = this.parseClarkNotation(properties[ii])
      if (this.xmlNamespaces[property.namespace]) {
        body += '    <' + this.xmlNamespaces[property.namespace] + ':' + property.name + ' />\n'
      } else {
        body += '    <x:' + property.name + ' xmlns:x="' + property.namespace + '" />\n'
      }
    }
    body += '  </d:prop>\n'
    body += '</d:propfind>'

    return this.request('PROPFIND', path, headers, body, null, options).then(
      function (result) {
        if (depth === '0') {
          return {
            status: result.status,
            body: result.body[0],
            res: result
          }
        } else {
          return {
            status: result.status,
            body: result.body,
            res: result
          }
        }
      }
    )
  }

  /**
   * Renders a "d:set" block for the given properties.
   *
   * @param {Object.<String,String>} properties
   * @return {String} XML "<d:set>" block
   */
  _renderPropSet (properties) {
    var body = '  <d:set>\n' +
          '   <d:prop>\n'

    for (var ii in properties) {
      // eslint-disable-next-line no-prototype-builtins
      if (!properties.hasOwnProperty(ii)) {
        continue
      }

      var property = this.parseClarkNotation(ii)
      var propName
      var propValue = properties[ii]
      if (this.xmlNamespaces[property.namespace]) {
        propName = this.xmlNamespaces[property.namespace] + ':' + property.name
      } else {
        propName = 'x:' + property.name + ' xmlns:x="' + property.namespace + '"'
      }

      // FIXME: hard-coded for now until we allow properties to
      // specify whether to be escaped or not
      if (propName !== 'd:resourcetype') {
        propValue = this._escapeXml(propValue)
      }
      body += '      <' + propName + '>' + propValue + '</' + propName + '>\n'
    }
    body += '    </d:prop>\n'
    body += '  </d:set>\n'
    return body
  }

  /**
   * Generates a propPatch request.
   *
   * @param {string} url Url to do the proppatch request on
   * @param {Object.<String,String>} properties List of properties to store.
   * @param {Object} [headers] headers
   * @return {Promise}
   */
  propPatch (url, properties, headers) {
    headers = headers || {}

    headers['Content-Type'] = 'application/xml; charset=utf-8'

    var body =
          '<?xml version="1.0"?>\n' +
          '<d:propertyupdate '
    var namespace
    for (namespace in this.xmlNamespaces) {
      body += ' xmlns:' + this.xmlNamespaces[namespace] + '="' + namespace + '"'
    }
    body += '>\n' + this._renderPropSet(properties)
    body += '</d:propertyupdate>'

    return this.request('PROPPATCH', url, headers, body).then(
      function (result) {
        return {
          status: result.status,
          body: result.body,
          res: result
        }
      }
    )
  }

  /**
   * Generates a MKCOL request.
   * If attributes are given, it will use an extended MKCOL request.
   *
   * @param {string} url Url to do the proppatch request on
   * @param {Object.<String,String>} [properties] list of properties to store.
   * @param {Object} [headers] headers
   * @return {Promise}
   */
  mkcol (url, properties, headers) {
    var body = ''
    headers = headers || {}
    headers['Content-Type'] = 'application/xml; charset=utf-8'

    if (properties) {
      body =
              '<?xml version="1.0"?>\n' +
              '<d:mkcol'
      var namespace
      for (namespace in this.xmlNamespaces) {
        body += ' xmlns:' + this.xmlNamespaces[namespace] + '="' + namespace + '"'
      }
      body += '>\n' + this._renderPropSet(properties)
      body += '</d:mkcol>'
    }

    return this.request('MKCOL', url, headers, body).then(
      function (result) {
        return {
          status: result.status,
          body: result.body,
          res: result
        }
      }
    )
  }

  /**
   * Performs a HTTP request, and returns a Promise
   *
   * @param {string} method HTTP method
   * @param {string} url Relative or absolute url
   * @param {Object} headers HTTP headers as an object.
   * @param {string} body HTTP request body.
   * @param {string} responseType HTTP request response type.
   * @param {Object} options
   * @param {Function} options.onProgress progress callback
   * @param {davVersion} options.version v1 | v2
   * @return {Promise}
   */
  request (method, path, headers, body, responseType, options = {}) {
    options.version = options.version || 'v1'
    const reqClient = options.version === 'v2' ? this.clientv2 : this.client

    return new Promise((resolve, reject) => {
      return reqClient.customRequest(decodeURIComponent(path), {
        method,
        headers,
        data: body
      }).then(res => {
        var resultBody = res.data
        if (res.status === 207) {
          resultBody = this.parseMultiStatus(resultBody)
        }
        resolve({
          body: resultBody,
          status: res.status,
          res
        })
      }).catch(error => {
        const res = error.response

        resolve({
          body: res.data,
          status: res.status,
          res
        })
      })
    })
  }

  /**
   * Parses a property node.
   *
   * Either returns a string if the node only contains text, or returns an
   * array of non-text subnodes.
   *
   * @param {Object} propNode node to parse
   * @return {string|Array} text content as string or array of subnodes, excluding text nodes
   */
  _parsePropNode (propNode) {
    var content = null
    if (propNode.constructor === Object) {
      if (Object.keys(propNode).length === 0) {
        return ''
      }
      var subNodes = []
      for (var key in propNode) {
        var node = propNode[key]
        if (typeof node !== 'object') {
          subNodes.push(node)
          continue
        }
        var nsComponent = key.split(':')[0]
        var localComponent = key.split(':')[1]
        var nsValue = this.xmlNamespacesComponents[nsComponent]
        subNodes.push('{' + nsValue + '}' + localComponent)
      }
      if (subNodes.length) {
        content = subNodes
      }
    } else if (propNode) {
      content = propNode
    } else {
      content = ''
    }

    return content
  }

  /**
   * Parses a multi-status response body.
   *
   * @param {string} xmlBody
   * @param {Array}
   */
  parseMultiStatus (xmlBody) {
    const doc = parser.xml2js(xmlBody)

    var responseIterator = doc['d:multistatus']['d:response']
    if (responseIterator.constructor !== Array) {
      responseIterator = [responseIterator]
    }
    var result = []
    responseIterator.forEach(responseNode => {
      var response = {
        href: null,
        propStat: []
      }

      response.href = responseNode['d:href']

      var propStatIterator = responseNode['d:propstat']

      if (propStatIterator.constructor !== Array) {
        propStatIterator = [propStatIterator]
      }
      propStatIterator.forEach(propStatNode => {
        var propStat = {
          status: propStatNode['d:status'],
          properties: {}
        }

        var propIterator = propStatNode['d:prop']
        if (propIterator.constructor !== Array) {
          propIterator = [propIterator]
        }
        propIterator.forEach(propNode => {
          for (var key in propNode) {
            var content = this._parsePropNode(propNode[key])
            var nsComponent = key.split(':')[0]
            var localComponent = key.split(':')[1]
            var nsValue = this.xmlNamespacesComponents[nsComponent]
            propStat.properties['{' + nsValue + '}' + localComponent] = content
          }
        })
        response.propStat.push(propStat)
      })

      result.push(response)
    })
    return result
  }

  parseClarkNotation (propertyName) {
    var result = propertyName.match(/^{([^}]+)}(.*)$/)
    if (!result) {
      return
    }

    return {
      name: result[2],
      namespace: result[1]
    }
  }
}
