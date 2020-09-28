var config = require('./config/config.json')
const utf8 = require('utf8')

var validUserPasswordHash = btoa(config.username + ':' + config.password)
const Pact = require('@pact-foundation/pact-web')

const accessControlAllowHeaders = 'OC-Checksum,OC-Total-Length,OCS-APIREQUEST,X-OC-Mtime,Accept,Authorization,Brief,Content-Length,Content-Range,Content-Type,Date,Depth,Destination,Host,If,If-Match,If-Modified-Since,If-None-Match,If-Range,If-Unmodified-Since,Location,Lock-Token,Overwrite,Prefer,Range,Schedule-Reply,Timeout,User-Agent,X-Expected-Entity-Length,Accept-Language,Access-Control-Request-Method,Access-Control-Allow-Origin,ETag,OC-Autorename,OC-CalDav-Import,OC-Chunked,OC-Etag,OC-FileId,OC-LazyOps,OC-Total-File-Length,Origin,X-Request-ID,X-Requested-With'
const defaultAccessControlAllowMethods = 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
const origin = 'http://localhost:9876'
const ocsCapabilitiesPathMatcher = '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/capabilities'
const applicationOrJson = 'application/json; charset=utf-8'
const textWithXml = 'text/xml; charset=utf-8'
const applicationWithXml = 'application/xml; charset=utf-8'
const textWithHtml = 'text/html; charset=utf-8'

const validAuthHeaders = {
  authorization: 'Basic ' + validUserPasswordHash,
  Origin: origin
}
const ocsSuccessMeta = ' <meta>\n' +
  '  <status>ok</status>\n' +
  '  <statuscode>100</statuscode>\n' +
  '  <message/>\n' +
  ' </meta>\n'
const xmlResponseHeaders = {
  'Content-Type': textWithXml,
  'Access-Control-Allow-Origin': origin
}

const invalidAuthHeader = Pact.Matchers.term({
  matcher: '^(?!Basic ' + validUserPasswordHash + ').*$', // match anything except a valid auth
  generate: 'Basic bm9uRXhpc3RpbmdVc2VycnByeXJxOHg2OmNvbmZpZy5wYXNzd29yZHJwcnlycTh4Ng=='
})

function getOcsResponseXmlBody (
  status,
  code,
  message = null,
  data = null,
  pagination = false
) {
  let responseBody = '<?xml version="1.0"?>\n' +
    '<ocs>\n' +
    ' <meta>\n' +
    `  <status>${status}</status>\n` +
    `  <statuscode>${code}</statuscode>\n`
  if (message) responseBody += `  <message>${message}</message>\n`
  else responseBody += '  <message/>\n'
  if (pagination) {
    responseBody += '  <totalitems></totalitems>\n' +
    '  <itemsperpage></itemsperpage>\n'
  }
  responseBody += ' </meta>\n'
  if (data) responseBody += ` <data>\n${data}</data>\n`
  else responseBody += ' <data/>\n'
  responseBody += '</ocs>'
  return responseBody
}

const unauthorizedOcsXmlResponseBody = getOcsResponseXmlBody(
  'failure',
  '997',
  'Unauthorized'
)

function getSuccessOcsResponseXmlBodyWithPagination (code) {
  return getOcsResponseXmlBody(
    'ok',
    code
  )
}

function getFailureXmlResponseWithCode (code) {
  return getOcsResponseXmlBody(
    'failure',
    code
  )
}

function getFailureXmlPaginatedResponseWithCodeAndMessage (code, message) {
  return getOcsResponseXmlBody(
    'failure',
    code,
    message,
    null,
    true
  )
}

function getFailureResponseXmlWithMessageAndCode (code, message) {
  return getOcsResponseXmlBody(
    'failure',
    code,
    message
  )
}

function getSuccessXmlResponseWithCode (code) {
  return getOcsResponseXmlBody(
    'ok',
    code
  )
}

function setGeneralInteractions (provider) {
  let i
  const promises = []

  promises.push(provider.addInteraction({
    uponReceiving: 'any CORS preflight request',
    withRequest: {
      method: 'OPTIONS',
      path: Pact.Matchers.regex({
        matcher: '.*',
        generate: '/ocs/v1.php/cloud/capabilities'
      }),
      headers: {
        'Access-Control-Request-Method': Pact.Matchers.regex({
          matcher: 'GET|POST|PUT|DELETE|MKCOL|PROPFIND',
          generate: 'GET'
        })
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a capabilities GET request with valid authentication',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.regex({
        matcher: ocsCapabilitiesPathMatcher,
        generate: '/ocs/v1.php/cloud/capabilities'
      }),
      query: 'format=json',
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': applicationOrJson,
        'Access-Control-Allow-Origin': origin
      },
      body: {
        ocs: {
          meta: {
            status: 'ok',
            statuscode: 100,
            message: 'OK'
          },
          data: {
            version: Pact.Matchers.like({
              major: 10,
              minor: 5,
              micro: 1,
              string: '10.5.1alpha1',
              edition: 'Enterprise'
            }),
            capabilities: {
              files: {
                privateLinks: true,
                privateLinksDetailsParam: true,
                bigfilechunking: true,
                blacklisted_files: [
                  '.htaccess'
                ],
                favorites: true,
                file_locking_support: true,
                file_locking_enable_file_action: false,
                undelete: true,
                versioning: true
              }
            }
          }
        }
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a capabilities GET request with invalid authentication',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: ocsCapabilitiesPathMatcher,
        generate: '/ocs/v1.php/cloud/capabilities'
      }),
      query: 'format=json',
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': applicationOrJson,
        'Access-Control-Allow-Origin': origin
      },
      body: {
        ocs: {
          meta: {
            status: 'failure',
            statuscode: 997,
            message: 'Unauthorised'
          }
        }
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request to the cloud user endpoint',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/user$',
        generate: '/ocs/v1.php/cloud/user'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': applicationWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: Pact.Matchers.term({
        matcher: '<\\?xml version="1\\.0"\\?>\\s' +
          '<ocs>\\s' +
          ' <meta>\\s' +
          '  <status>ok<\\/status>\\s' +
          '  <statuscode>100<\\/statuscode>\\s' +
          '  <message>OK<\\/message>\\s' +
          '  <totalitems><\\/totalitems>\\s' +
          '  <itemsperpage><\\/itemsperpage>\\s' +
          ' <\\/meta>\\s' +
          ' <data>\\s' +
          '  <id>admin<\\/id>\\s' +
          '  <display-name>admin<\\/display-name>\\s' +
          '  <email><\\/email>\\s.*' +
          ' <\\/data>\\s' +
          '<\\/ocs>',
        generate: getOcsResponseXmlBody(
          'ok',
          '100',
          'OK',
          '  <id>admin</id>\n' +
          '  <display-name>admin</display-name>\n' +
          '  <email></email>\n',
          true
        )
      })
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a single user GET request to the cloud users endpoint',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v2\\.php\\/cloud\\/users\\/.+',
        generate: '/ocs/v2.php/cloud/users/' + config.testUser
      }),
      query: 'format=json',
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': applicationOrJson,
        'Access-Control-Allow-Origin': origin
      },
      body: {
        ocs: {
          meta: {
            status: 'ok',
            statuscode: 200,
            message: null
          },
          data: {
            email: 'foo@bar.net'
          }
        }
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a create user request',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users',
        generate: '/ocs/v1.php/cloud/users'
      }),
      headers: validAuthHeaders,
      body: 'password=' + config.testUser + '&userid=' + config.testUser
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a create user request including group membership',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users',
        generate: '/ocs/v1.php/cloud/users'
      }),
      headers: validAuthHeaders,
      body: 'password=' + config.testUserPassword + '&userid=' + config.testUser + '&groups%5B0%5D=' + config.testGroup
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getSuccessXmlResponseWithCode(100)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'an update user request that sets email',
    given (providerState) {
      return 'my state'
    },
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/.+',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser
      }),
      query: 'format=json',
      headers: validAuthHeaders,
      body: {
        key: 'email',
        value: 'foo@bar.net'
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin
      },
      body: {
        ocs: {
          meta: {
            status: 'ok',
            statuscode: 200,
            message: null
          },
          data: []
        }
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'set user attribute of an existent user, attribute is allowed',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/' + config.testUser,
        generate: '/ocs/v1.php/cloud/users/' + config.testUser
      }),
      headers: validAuthHeaders,
      body: 'key=email&value=asd%40a.com'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': textWithXml,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: getSuccessXmlResponseWithCode(100)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'get user attribute of an existent user',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': textWithXml
      },
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <enabled>true</enabled>\n' +
        '  <quota>\n' +
        '   <definition>default</definition>\n' +
        '  </quota>\n' +
        '  <email>asd@a.com</email>\n' +
        '  <displayname>test123</displayname>\n' +
        '  <two_factor_auth_enabled>false</two_factor_auth_enabled>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'set user attribute of an existent user, attribute is not allowed',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/' + config.testUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser
      }),
      headers: validAuthHeaders,
      body: 'key=email&value=%C3%83%C2%A4%C3%83%C2%B6%C3%83%C2%BC%C3%83%C2%A4%C3%83%C2%A4_sfsdf%2B%24%25%2F)%25%26%3D'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': textWithXml,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: getFailureXmlResponseWithCode(102)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'set user attribute of a non-existent user',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser
      }),
      headers: validAuthHeaders,
      body: 'key=email&value=asd%40a.com'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': textWithXml,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: getFailureXmlResponseWithCode(997)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'add user to group with an existent user and a non existent group',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/groups$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/groups'
      }),
      headers: validAuthHeaders,
      body: 'groupid=' + config.nonExistentGroup
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureXmlResponseWithCode(102)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'add user to group with a non-existent user and an existent group',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '\\/groups$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser + '/groups'
      }),
      headers: validAuthHeaders,
      body: 'groupid=' + config.testGroup
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureXmlResponseWithCode(102)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'get user groups with a non-existent user',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '\\/groups$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser + '/groups'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureXmlResponseWithCode(998)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'Remove user from a group, with existent user and non existent group',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/' + config.testUser + '\\/groups$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/groups'
      }),
      headers: validAuthHeaders,
      body: 'groupid=' + config.nonExistentGroup
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureXmlResponseWithCode(102)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'Remove user from a group, with non-existent user and an existent group',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '\\/groups$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser + '/groups'
      }),
      headers: validAuthHeaders,
      body: 'groupid=' + config.testGroup
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureXmlResponseWithCode(102)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'Add user to subadmin group, with existent user non existent group',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/' + config.testUser + '\\/subadmins$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/subadmins'
      }),
      headers: validAuthHeaders,
      body: 'groupid=' + config.nonExistentGroup
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureResponseXmlWithMessageAndCode(102, 'Group:thisGroupShouldNotExist does not exist')
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'Add user to subadmin group, with non-existent user and existent group',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '\\/subadmins$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser + '/subadmins'
      }),
      headers: validAuthHeaders,
      body: 'groupid=' + config.testGroup
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureResponseXmlWithMessageAndCode(101, 'User does not exist')
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'Get user subadmin group with a non existent user',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '\\/subadmins$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser + '/subadmins'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureResponseXmlWithMessageAndCode(101, 'User does not exist')
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'an update request for an unknown user',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/users\\/unknown-user$',
        generate: '/ocs/v2.php/cloud/users/unknown-user'
      }),
      query: 'format=json',
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': origin
      },
      body: {
        ocs: {
          meta: {
            statuscode: 997
          }
        }
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request for a list of apps',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/apps$',
        generate: '/ocs/v1.php/cloud/apps'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <apps>\n' +
        '   <element>workflow</element>\n' +
        '   <element>files</element>\n' +
        '  </apps>\n'
      )
    }
  }))

  // a request to GET attributes of an app
  const attributes = {
    attr1: {
      attrExists: true,
      value: 'value1'
    },
    'attr+plus space': {
      attrExists: true,
      value: 'value+plus space and/slash'
    },
    属性1: {
      attrExists: true,
      value: '值对1'
    },
    'attr ': {
      attrExists: false,
      value: ''
    },
    'attr+plus space ': {
      attrExists: false,
      value: ''
    },
    '属性1 ': {
      attrExists: false,
      value: ''
    },
    '': {
      attrExists: false,
      value: {
        attr1: 'value1',
        'attr+plus space': 'value+plus space and/slash',
        属性1: '值对1'
      }
    },
    'attr1-no-value': {
      attrExists: true,
      value: ''
    },
    'attr+plus space-no-value': {
      attrExists: true,
      value: ''
    },
    '属性1-no-value': {
      attrExists: true,
      value: ''
    }
  }
  for (const attribute in attributes) {
    // default no data
    let data = ' <data/>\n'

    // no attributes specified, return all attributes
    if (attribute === '') {
      data = ' <data>\n'
      for (const [key, value] of Object.entries(attributes[attribute].value)) {
        data = data +
          '  <element>\n' +
          '   <key>' + utf8.encode(key) + '</key>\n' +
          '   <app>someAppName</app>\n' +
          '   <value>' + utf8.encode(value) + '</value>\n' +
          '  </element>\n'
      }
      data = data + ' </data>'
    } else if (attributes[attribute].attrExists === true) {
      // attribute exists
      data = ' <data>\n' +
        '  <element>\n' +
        '   <key>' + utf8.encode(attribute) + '</key>\n' +
        '   <app>someAppName</app>\n' +
        '   <value>' + utf8.encode(attributes[attribute].value) + '</value>\n' +
        '  </element>\n' +
        ' </data>\n'
    }
    promises.push(provider.addInteraction({
      uponReceiving: 'a request to GET ' + attribute + '-attribute of an app',
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/privatedata\\/getattribute\\/someAppName\\/?' + encodeURIComponent(utf8.encode(attribute)) + '$',
          generate: '/ocs/v1.php/privatedata/getattribute/someAppName/' + encodeURIComponent(utf8.encode(attribute))
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: xmlResponseHeaders,
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ocsSuccessMeta +
          data +
          '</ocs>'
      }
    }))
  }

  // a request to GET attributes of an app that has no values set
  let data = ' <data>\n'
  const values = ['attr1', 'attr+plus space', '属性1']
  for (let i = 0; i < values.length; i++) {
    data = data +
      '  <element>\n' +
      '   <key>' + utf8.encode(values[i]) + '</key>\n' +
      '   <app>someAppName-no-value</app>\n' +
      '   <value></value>\n' +
      '  </element>\n'
  }
  data = data + ' </data>'
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to GET attributes of an app that has no values set',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/privatedata\\/getattribute\\/someAppName-no-value$',
        generate: '/ocs/v1.php/privatedata/getattribute/someAppName-no-value'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsSuccessMeta +
        data +
        '</ocs>'
    }
  }))

  let requests = ['POST', 'DELETE']
  for (let i = 0; i < requests.length; i++) {
    const action = (requests[i] === 'POST') ? 'enable' : 'disable'
    promises.push(provider.addInteraction({
      uponReceiving: action + ' apps',
      withRequest: {
        method: requests[i],
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/apps\\/.+$',
          generate: '/ocs/v1.php/cloud/apps/files'
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: xmlResponseHeaders,
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ocsSuccessMeta +
          ' <data/>\n' +
          '</ocs>'
      }
    }))
  }

  promises.push(provider.addInteraction({
    uponReceiving: 'a GET config request',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/config',
        generate: '/ocs/v1.php/config'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <version>1.7</version>\n' +
        '  <website>ownCloud</website>\n' +
        '  <host>localhost</host>\n' +
        '  <contact></contact>\n' +
        '  <ssl>false</ssl>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET groups request',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups$',
        generate: '/ocs/v1.php/cloud/groups'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <groups>\n' +
        '   <element>admin</element>\n' +
        '   <element>' + config.testGroup + '</element>\n' +
        '  </groups>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to GET members of the admin group',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups\\/admin$',
        generate: '/ocs/v1.php/cloud/groups/admin'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <users>\n' +
        '   <element>admin</element>\n' +
        '  </users>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a DELETE request for a non-existent group',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups\\/' + config.nonExistentGroup + '$',
        generate: '/ocs/v1.php/cloud/groups/' + config.nonExistentGroup
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureXmlResponseWithCode(101)
    }
  }))
  promises.push(provider.addInteraction({
    // TODO: for provider test, need to add a state to put user in group
    uponReceiving: 'a request to GET the groups that a user is a member of',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/groups$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/groups'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <groups>\n' +
        '   <element>' + config.testGroup + '</element>\n' +
        '  </groups>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    // TODO: for provider test, need to add a state to make user subadmin of the group
    uponReceiving: 'a request to GET groups that a user is a subadmin of',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/subadmins$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/subadmins'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '   <element>' + config.testGroup + '</element>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to GET user information of an existing user',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.username + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.username
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <enabled>true</enabled>\n' +
        '  <quota>\n' +
        '   <free>57800708096</free>\n' + // TODO need to be made more flexible for provider tests
        '   <used>2740027</used>\n' +
        '   <total>57803448123</total>\n' +
        '   <relative>0</relative>\n' +
        '   <definition>default</definition>\n' +
        '  </quota>\n' +
        '  <email/>\n' +
        '  <displayname>' + config.username + '</displayname>\n' +
        '  <two_factor_auth_enabled>false</two_factor_auth_enabled>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to GET user information of a non-existent user',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureResponseXmlWithMessageAndCode(998, 'The requested user could not be found')
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to delete a user',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getSuccessXmlResponseWithCode(100)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to delete a non-existent user',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureXmlResponseWithCode(101)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to list all users',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
        generate: '/ocs/v1.php/cloud/users'
      }),
      query: '',
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <users>\n' +
        '   <element>' + config.username + '</element>\n' +
        '   <element>' + config.testUser + '</element>\n' +
        '  </users>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to list a single user',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
        generate: '/ocs/v1.php/cloud/users'
      }),
      query: 'search=' + config.username,
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <users>\n' +
        '   <element>' + config.username + '</element>\n' +
        '  </users>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to list a non-existent user',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
        generate: '/ocs/v1.php/cloud/users'
      }),
      query: 'search=' + config.nonExistentUser,
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getOcsResponseXmlBody(
        'ok',
        '100',
        null,
        '  <users/>\n'
      )
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a create group POST request',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups$',
        generate: '/ocs/v1.php/cloud/groups'
      }),
      headers: {
        authorization: 'Basic ' + validUserPasswordHash,
        Origin: origin
      },
      body: 'groupid=' + config.testGroup
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: getSuccessXmlResponseWithCode(100)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a user DELETE request',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users/' + config.testUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser
      }),
      headers: {
        authorization: validAuthHeaders,
        Origin: origin
      },
      body: 'undefined=undefined'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: getSuccessXmlResponseWithCode(100)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a group DELETE request',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups/' + config.testGroup + '$',
        generate: '/ocs/v1.php/cloud/groups/' + config.testGroup
      }),
      headers: {
        authorization: 'Basic ' + validUserPasswordHash,
        Origin: origin
      },
      body: 'undefined=undefined'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: getSuccessXmlResponseWithCode(100)
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to get share recipients (both users and groups)',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v2\\.php\\/apps\\/files_sharing\\/api\\/v1\\/sharees$',
        generate: '/ocs/v2.php/apps/files_sharing/api/v1/sharees'
      }),
      query: 'search=test&itemType=folder&page=1&perPage=200&format=json',
      headers: {
        authorization: 'Basic ' + validUserPasswordHash,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': applicationOrJson,
        'Access-Control-Allow-Origin': origin
      },
      body: '{"ocs"' +
        ':{"meta":{"status":"ok","statuscode":200,' +
        '"message":"OK","totalitems":"","itemsperpage":""},' +
        '"data":{"exact":{"users":[],"groups":[],"remotes":[]},' +
        '"users":[{"label":"test123","value":{"shareType":0,"shareWith":"test123"}}],' +
        '"groups":[{"label":"testGroup","value":{"shareType":1,"shareWith":"testGroup"}}],' +
        '"remotes":[]}}}'
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'an apps GET request with invalid auth',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/apps',
        generate: '/ocs/v1.php/cloud/apps'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'an enable app POST request with invalid auth',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/apps\\/files',
        generate: '/ocs/v1.php/cloud/apps/files'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a disable app DELETE request with invalid auth',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/apps\\/files',
        generate: '/ocs/v1.php/cloud/apps/files'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  let key = ['attr1', 'attr%2Bplus%20space', '%C3%A5%C2%B1%C2%9E%C3%A6%C2%80%C2%A71']
  for (i = 0; i < key.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'get attributes GET ' + key[i] + ' apps request with invalid auth',
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/privatedata\\/getattribute\\/' + config.testApp + '\\/' + key[i],
          generate: '/ocs/v1.php/privatedata/getattribute/' + config.testApp + '/' + key[i]
        }),
        headers: {
          authorization: invalidAuthHeader,
          Origin: origin
        }
      },
      willRespondWith: {
        status: 401,
        headers: {
          'Content-Type': textWithXml,
          'Access-Control-Allow-Origin': origin
        },
        body: unauthorizedOcsXmlResponseBody
      }
    }))
  }

  key = ['attr1', 'attr%2Bplus%20space', '%C3%A5%C2%B1%C2%9E%C3%A6%C2%80%C2%A71']
  const value = ['value1', 'value%2Bplus+space+and%2Fslash', '%C3%A5%C2%80%C2%BC%C3%A5%C2%AF%C2%B91']

  for (i = 0; i < key.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'set ' + key[i] + '-attribute POST apps request with invalid auth',
      withRequest: {
        method: 'POST',
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/privatedata\\/setattribute\\/' + config.testApp + '\\/' + key[i],
          generate: '/ocs/v1.php/privatedata/setattribute/' + config.testApp + '/' + key[i]
        }),
        headers: {
          authorization: invalidAuthHeader,
          Origin: origin
        },
        body: 'value=' + value[i]
      },
      willRespondWith: {
        status: 401,
        headers: {
          'Content-Type': textWithXml,
          'Access-Control-Allow-Origin': origin
        },
        body: unauthorizedOcsXmlResponseBody
      }
    }))
  }

  key = ['attr1', 'attr%2Bplus%20space', '%C3%A5%C2%B1%C2%9E%C3%A6%C2%80%C2%A71']

  for (i = 0; i < key.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'delete ' + key[i] + '-attribute POST apps request with invalid auth',
      withRequest: {
        method: 'POST',
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/privatedata\\/deleteattribute\\/' + config.testApp + '\\/' + key[i],
          generate: '/ocs/v1.php/privatedata/deleteattribute/' + config.testApp + '/' + key[i]
        }),
        headers: {
          authorization: invalidAuthHeader,
          Origin: origin
        }
      },
      willRespondWith: {
        status: 401,
        headers: {
          'Content-Type': textWithXml,
          'Access-Control-Allow-Origin': origin
        },
        body: unauthorizedOcsXmlResponseBody
      }
    }))
  }

  promises.push(provider.addInteraction({
    uponReceiving: 'an add group POST request with invalid auth',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups$',
        generate: '/ocs/v1.php/cloud/groups'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a group GET request with invalid auth',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups$',
        generate: '/ocs/v1.php/cloud/groups'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'an admin group GET request with invalid auth',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups\\/admin$',
        generate: '/ocs/v1.php/cloud/groups/admin'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a group DELETE request with invalid auth',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups\\/' + config.testGroup + '$',
        generate: '/ocs/v1.php/cloud/groups/' + config.testGroup
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a link share POST request of a file with invalid auth',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      },
      body: 'shareType=3&path=%2F' + config.testFile
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a user share POST request with invalid auth',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      },
      body: 'shareType=0&shareWith=' + config.testUser + '&path=%2F' + config.testFile
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a group share POST request with invalid auth',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      },
      body: 'shareType=1&shareWith=' + config.testGroup + '&path=%2F' + config.testFile + '&permissions=19'
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request for a non-existent file share with invalid auth',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      query: 'path=%2F' + config.nonExistentFile,
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request for a share using invalid auth',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/1$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/1'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request for all shares using invalid auth',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      query: 'path=%2F1',
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a link share POST request of a folder with invalid auth',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      },
      body: 'shareType=3&path=%2F' + config.testFolder
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a DELETE share request with invalid auth',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/123$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/123'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request with invalid auth to check for user admin',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/admin$',
        generate: '/ocs/v1.php/cloud/users/admin'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a create user POST request with invalid auth',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
        generate: '/ocs/v1.php/cloud/users'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a user GET request with invalid auth',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
        generate: '/ocs/v1.php/cloud/users'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a user PUT request with invalid auth',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a user POST request with invalid auth to add user to group',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/groups$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/groups'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a group user GET request with invalid auth',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/groups$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/groups'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request with invalid auth to check for user',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a DELETE request with invalid auth to remove user from group',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/groups$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/groups'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a POST request with invalid auth to add user to subadmin group',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/subadmins$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/subadmins'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request with invalid auth to check if user is a subadmin of any groups',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/subadmins$',
        generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/subadmins'
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to DELETE a non-existent user with invalid auth',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser
      }),
      headers: {
        authorization: invalidAuthHeader,
        Origin: origin
      }
    },
    willRespondWith: {
      status: 401,
      headers: {
        'Content-Type': textWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedOcsXmlResponseBody
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'Share with permissions in attributes',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      headers: validAuthHeaders,
      body: `shareType=0&shareWith=${config.testUser}&path=%2F${config.testFile}&attributes%5B0%5D%5Bscope%5D=ownCloud&attributes%5B0%5D%5Bkey%5D=read&attributes%5B0%5D%5Bvalue%5D=true&attributes%5B1%5D%5Bscope%5D=ownCloud&attributes%5B1%5D%5Bkey%5D=share&attributes%5B1%5D%5Bvalue%5D=true`
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': applicationWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ' <meta>\n' +
        '  <status>ok</status>\n' +
        '  <statuscode>100</statuscode>\n' +
        '  <message/>\n' +
        '  <totalitems></totalitems>\n' +
        '  <itemsperpage></itemsperpage>\n' +
        ' </meta>\n' +
        ' <data>\n' +
        '  <id>7</id>\n' +
        '  <share_type>0</share_type>\n' +
        '  <uid_owner>admin</uid_owner>\n' +
        '  <displayname_owner>admin</displayname_owner>\n' +
        '  <permissions>17</permissions>\n' +
        '  <stime>1600332102</stime>\n' +
        '  <parent/>\n' +
        '  <expiration/>\n' +
        '  <token/>\n' +
        '  <uid_file_owner>admin</uid_file_owner>\n' +
        '  <displayname_file_owner>admin</displayname_file_owner>\n' +
        '  <additional_info_owner/>\n' +
        '  <additional_info_file_owner/>\n' +
        '  <path>/.......txt</path>\n' +
        '  <item_type>file</item_type>\n' +
        '  <mimetype>text/plain</mimetype>\n' +
        '  <storage_id>home::admin</storage_id>\n' +
        '  <storage>1</storage>\n' +
        '  <item_source>2147498361</item_source>\n' +
        '  <file_source>2147498361</file_source>\n' +
        '  <file_parent>3</file_parent>\n' +
        '  <file_target>/.......txt</file_target>\n' +
        '  <share_with>test123</share_with>\n' +
        '  <share_with_displayname>test123</share_with_displayname>\n' +
        '  <share_with_additional_info/>\n' +
        '  <mail_send>0</mail_send>\n' +
        '  <attributes>[{&quot;scope&quot;:&quot;ownCloud&quot;,&quot;key&quot;:&quot;read&quot;,&quot;enabled&quot;:&quot;true&quot;},{&quot;scope&quot;:&quot;ownCloud&quot;,&quot;key&quot;:&quot;share&quot;,&quot;enabled&quot;:&quot;true&quot;}]</attributes>\n' +
        ' </data>\n' +
        '</ocs>'
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'Put file contents',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/remote\\.php\\/webdav\\/' + config.testFile,
        generate: '/remote.php/webdav/' + config.testFile
      }),
      headers: validAuthHeaders,
      body: config.testContent
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Request-Method': Pact.Matchers.regex({
          matcher: 'GET|POST|PUT|DELETE',
          generate: 'GET'
        }),
        'Access-Control-Allow-Origin': origin
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'successfully create a folder',
    withRequest: {
      method: 'MKCOL',
      path: Pact.Matchers.term({
        // accept any request to testfolder and any subfolders except notExistentDir
        matcher: '.*\\/remote\\.php\\/webdav\\/' + config.testFolder + '\\/(?!' + config.nonExistentDir + ').*\\/?',
        generate: '/remote.php/webdav/' + config.testFolder + '/'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 201,
      headers: {
        'Content-Type': textWithHtml,
        'Access-Control-Allow-Origin': origin
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'creating a folder in a not existing root',
    withRequest: {
      method: 'MKCOL',
      path: Pact.Matchers.term({
        matcher: '.*\\/remote\\.php\\/webdav\\/' + config.testFolder + '\\/' + config.nonExistentDir + '\\/.*\\/',
        generate: '/remote.php/webdav/' + config.testFolder + '/' + config.nonExistentDir + '/newFolder/'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 409,
      headers: {
        'Content-Type': textWithHtml,
        'Access-Control-Allow-Origin': origin
      },
      body: '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<d:error xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns">\n' +
        '  <s:exception>Sabre\\DAV\\Exception\\Conflict</s:exception>\n' +
        '  <s:message>Parent node does not exist</s:message>\n' +
        '</d:error>\n'
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'list content of a folder',
    withRequest: {
      method: 'PROPFIND',
      path: Pact.Matchers.term({
        matcher: '.*\\/remote\\.php\\/webdav\\/.*\\/',
        generate: '/remote.php/webdav/' + config.testFolder + '/'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 207,
      headers: {
        'Content-Type': applicationWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body:
        '<?xml version="1.0"?> ' +
        ' <d:multistatus xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns" xmlns:oc="http://owncloud.org/ns"> ' +
        ' <d:response> ' +
        ' <d:href>/owncloud-core/remote.php/webdav/' + config.testFolder + '/new%20folder/</d:href> ' +
        ' <d:propstat> ' +
        ' <d:prop> ' +
        ' <d:getlastmodified>Tue, 22 Sep 2020 09:27:57 GMT</d:getlastmodified> ' +
        ' <d:resourcetype> ' +
        ' <d:collection/> ' +
        ' </d:resourcetype> ' +
        ' <d:quota-used-bytes>0</d:quota-used-bytes> ' +
        ' <d:quota-available-bytes>-3</d:quota-available-bytes> ' +
        ' <d:getetag>&quot;5f69c39d0f947&quot;</d:getetag> ' +
        ' </d:prop> ' +
        ' <d:status>HTTP/1.1 200 OK</d:status> ' +
        ' </d:propstat> ' +
        ' </d:response> ' +
        ' </d:multistatus>'
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'successfully delete a file or folder',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/remote\\.php\\/webdav\\/.*\\/',
        generate: '/remote.php/webdav/' + config.testFolder + '/' + config.testFile
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin
      }
    }
  }))

  var file = ['test.txt', 'test space and + and #.txt', '文件.txt']
  var path = ['%2Ftest.txt', '%2Ftest+space+and+%2B+and+%23.txt', '%2F%E6%96%87%E4%BB%B6.txt']
  var id = [14, 18, 19]
  var token = ['yrkoLeS33y1aTya', 'eGAWIbKUImVbtu4', 'JbdgMGkt3Cq6B0u']
  for (i = 0; i < file.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a request to share file ' + path[i] + ' as link share',
      withRequest: {
        method: 'POST',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        }),
        headers: validAuthHeaders,
        body: 'shareType=3&path=' + path[i]
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': applicationWithXml,
          'Access-Control-Allow-Origin': origin
        },
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <id>' + id[i] + '</id>\n' +
          '  <share_type>3</share_type>\n' +
          '  <uid_owner>admin</uid_owner>\n' +
          '  <displayname_owner>admin</displayname_owner>\n' +
          '  <permissions>1</permissions>\n' +
          '  <parent/>\n' +
          '  <expiration/>\n' +
          '  <token>' + token[i] + '</token>\n' +
          '  <uid_file_owner>admin</uid_file_owner>\n' +
          '  <displayname_file_owner>admin</displayname_file_owner>\n' +
          '  <additional_info_owner/>\n' +
          '  <additional_info_file_owner/>\n' +
          '  <path>' + file[i] + '</path>\n' +
          '  <item_type>file</item_type>\n' +
          '  <file_target>' + file[i] + '</file_target>\n' +
          '  <name/>\n' +
          '  <url>http://localhost/oc/s/yrkoLeS33y1aTya</url>\n' +
          '  <mail_send>0</mail_send>\n' +
          '  <attributes/>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    }))
  }

  file = ['test.txt', 'test space and + and #.txt', '文件.txt']
  path = ['%2Ftest.txt', '%2Ftest%20space%20and%20%2B%20and%20%23.txt', '%2F%E6%96%87%E4%BB%B6.txt']
  id = [14, 18, 19]
  token = ['yrkoLeS33y1aTya', 'eGAWIbKUImVbtu4', 'JbdgMGkt3Cq6B0u']
  let shareids
  let files
  for (i = 0; i < file.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a GET request for a share ' + path[i],
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        }),
        query: 'path=' + path[i],
        headers: {
          authorization: 'Basic YWRtaW46YWRtaW4=',
          Origin: origin
        }
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
        },
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <element>\n' +
          '   <id>' + id[i] + '</id>\n' +
          '   <share_type>3</share_type>\n' +
          '   <uid_owner>admin</uid_owner>\n' +
          '   <displayname_owner>admin</displayname_owner>\n' +
          '   <permissions>1</permissions>\n' +
          '   <parent/>\n' +
          '   <expiration/>\n' +
          '   <token>' + token[i] + '</token>\n' +
          '   <uid_file_owner>admin</uid_file_owner>\n' +
          '   <displayname_file_owner>admin</displayname_file_owner>\n' +
          '   <additional_info_owner/>\n' +
          '   <additional_info_file_owner/>\n' +
          '   <path>/' + file[i] + '</path>\n' +
          '   <item_type>file</item_type>\n' +
          '   <file_target>/' + file[i] + '</file_target>\n' +
          '   <name/>\n' +
          '   <url>http://localhost/oc/s/P4sVlWUvQXwro6z</url>\n' +
          '   <mail_send>0</mail_send>\n' +
          '   <attributes/>\n' +
          '  </element>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    }))
  }

  shareids = [14, 18, 19, 9]
  for (const shareid of shareids) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a DELETE request for a share with id ' + shareid,
      withRequest: {
        method: 'DELETE',
        path: Pact.Matchers.term({

          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/' + shareid + '$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/' + shareid
        }),
        headers: validAuthHeaders,
        body: 'undefined=undefined'
      },
      willRespondWith: {
        status: 200,
        headers: xmlResponseHeaders,
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data/>\n' +
          '</ocs>'
      }
    }))
  }

  shareids = [14, 18, 19]
  file = ['test.txt', 'test space and + and #.txt', '文件.txt']
  for (i = 0; i < file.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a GET request for an existent share with id ' + shareids[i],
      withRequest: {
        method: 'GET',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/' + shareids[i] + '$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/' + shareids[i]
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: xmlResponseHeaders,
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <element>\n' +
          '   <id>' + shareids[i] + '</id>\n' +
          '   <share_type>0</share_type>\n' +
          '   <uid_owner>admin</uid_owner>\n' +
          '   <displayname_owner>admin</displayname_owner>\n' +
          '   <permissions>19</permissions>\n' +
          '   <parent/>\n' +
          '   <expiration/>\n' +
          '   <token/>\n' +
          '   <uid_file_owner>admin</uid_file_owner>\n' +
          '   <displayname_file_owner>admin</displayname_file_owner>\n' +
          '   <additional_info_owner/>\n' +
          '   <additional_info_file_owner/>\n' +
          '   <path>' + file[i] + '</path>\n' +
          '   <item_type>file</item_type>\n' +
          '   <file_target>' + file[i] + '</file_target>\n' +
          '   <share_with>test123</share_with>\n' +
          '   <share_with_displayname>test123</share_with_displayname>\n' +
          '   <share_with_additional_info/>\n' +
          '   <attributes/>\n' +
          '  </element>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    }))
  }

  files = ['test.txt', '%E6%96%87%E4%BB%B6.txt', 'test%20space%20and%20%2B%20and%20%23.txt', 'newFileCreated123']
  for (const file of files) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a DELETE request for a file ' + file,
      withRequest: {
        method: 'DELETE',
        path: Pact.Matchers.term({
          matcher: '.*\\/remote\\.php\\/webdav\\/' + file + '$',
          generate: '/remote.php/webdav/' + file
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: xmlResponseHeaders,
        body: getSuccessXmlResponseWithCode(100)
      }
    }))
  }

  files = ['test.txt', '%E6%96%87%E4%BB%B6.txt', 'test%20space%20and%20%2B%20and%20%23.txt']
  for (const file of files) {
    promises.push(provider.addInteraction({
      uponReceiving: 'Put file contents to file ' + file,
      withRequest: {
        method: 'PUT',
        path: Pact.Matchers.regex({
          matcher: '.*\\/remote\\.php\\/webdav\\/' + file,
          generate: '/remote.php/webdav/' + file
        }),
        headers: validAuthHeaders,
        body: config.testContent
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin
        }
      }
    }))
  }

  promises.push(provider.addInteraction({
    uponReceiving: 'Put file contents as empty content in files specified',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/remote\\.php\\/webdav\\/newFileCreated123$',
        generate: '/remote.php/webdav/newFileCreated123'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin
      }
    }
  })
  )

  file = ['test.txt', 'test space and + and #.txt', '文件.txt']
  path = ['%2Ftest.txt', '%2Ftest+space+and+%2B+and+%23.txt', '%2F%E6%96%87%E4%BB%B6.txt']
  id = [14, 18, 19]
  for (i = 0; i < file.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a user share POST request with valid auth of path ' + path[i],
      withRequest: {
        method: 'POST',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        }),
        headers: {
          authorization: 'Basic YWRtaW46YWRtaW4=',
          Origin: origin
        },
        body: 'shareType=0&shareWith=' + config.testUser + '&path=' + path[i]
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': applicationWithXml,
          'Access-Control-Allow-Origin': origin
        },
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <id>' + id[i] + '</id>\n' +
          '  <share_type>0</share_type>\n' +
          '  <uid_owner>admin</uid_owner>\n' +
          '  <displayname_owner>admin</displayname_owner>\n' +
          '  <permissions>19</permissions>\n' +
          '  <parent/>\n' +
          '  <expiration/>\n' +
          '  <token/>\n' +
          '  <uid_file_owner>admin</uid_file_owner>\n' +
          '  <displayname_file_owner>admin</displayname_file_owner>\n' +
          '  <additional_info_owner/>\n' +
          '  <additional_info_file_owner/>\n' +
          '  <path>' + file[i] + '</path>\n' +
          '  <item_type>file</item_type>\n' +
          '  <file_target>' + file[i] + '</file_target>\n' +
          '  <share_with>test123</share_with>\n' +
          '  <share_with_displayname>test123</share_with_displayname>\n' +
          '  <share_with_additional_info/>\n' +
          '  <attributes/>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    }))
  }

  shareids = [14, 18, 19]
  file = ['test.txt', 'test space and + and #.txt', '文件.txt']
  for (i = 0; i < file.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a PUT request to update user share permissions of share with id ' + shareids[i],
      withRequest: {
        method: 'PUT',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/' + shareids[i] + '$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/' + shareids[i]
        }),
        headers: {
          authorization: 'Basic YWRtaW46YWRtaW4=',
          Origin: origin
        },
        body: 'permissions=19'
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': applicationWithXml,
          'Access-Control-Allow-Origin': origin
        },
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <id>' + shareids[i] + '</id>\n' +
          '  <share_type>0</share_type>\n' +
          '  <uid_owner>admin</uid_owner>\n' +
          '  <displayname_owner>admin</displayname_owner>\n' +
          '  <permissions>19</permissions>\n' +
          '  <parent/>\n' +
          '  <expiration/>\n' +
          '  <token/>\n' +
          '  <uid_file_owner>admin</uid_file_owner>\n' +
          '  <displayname_file_owner>admin</displayname_file_owner>\n' +
          '  <additional_info_owner/>\n' +
          '  <additional_info_file_owner/>\n' +
          '  <path>' + file[i] + '</path>\n' +
          '  <item_type>file</item_type>\n' +
          '  <mimetype>text/plain</mimetype>\n' +
          '  <file_target>' + file[i] + '</file_target>\n' +
          '  <share_with>test123</share_with>\n' +
          '  <share_with_displayname>test123</share_with_displayname>\n' +
          '  <share_with_additional_info/>\n' +
          '  <attributes/>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    }))
  }

  file = ['test.txt', 'test space and + and #.txt', '文件.txt']
  path = ['%2Ftest.txt', '%2Ftest+space+and+%2B+and+%23.txt', '%2F%E6%96%87%E4%BB%B6.txt']
  id = [14, 18, 19]
  for (i = 0; i < file.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a group share POST request with valid auth to path ' + path[i],
      withRequest: {
        method: 'POST',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        }),
        headers: {
          authorization: 'Basic YWRtaW46YWRtaW4=',
          Origin: origin
        },
        body: 'shareType=1&shareWith=' + config.testGroup + '&path=' + path[i] + '&permissions=19'
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': applicationWithXml,
          'Access-Control-Allow-Origin': origin
        },
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <id>' + id[i] + '</id>\n' +
          '  <share_type>1</share_type>\n' +
          '  <uid_owner>admin</uid_owner>\n' +
          '  <displayname_owner>admin</displayname_owner>\n' +
          '  <permissions>19</permissions>\n' +
          '  <parent/>\n' +
          '  <expiration/>\n' +
          '  <token/>\n' +
          '  <uid_file_owner>admin</uid_file_owner>\n' +
          '  <displayname_file_owner>admin</displayname_file_owner>\n' +
          '  <additional_info_owner/>\n' +
          '  <additional_info_file_owner/>\n' +
          '  <path>' + file[i] + '</path>\n' +
          '  <item_type>file</item_type>\n' +
          '  <file_target>' + file[i] + '</file_target>\n' +
          '  <share_with>testGroup</share_with>\n' +
          '  <share_with_displayname>testGroup</share_with_displayname>\n' +
          '  <attributes/>\n' +
          ' </data>\n' +
          '</ocs>'
      }
    }))
  }

  promises.push(provider.addInteraction({
    uponReceiving: 'a link share POST request with a non-existent file',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      headers: {
        authorization: 'Basic YWRtaW46YWRtaW4=',
        Origin: origin
      },
      body: 'shareType=3' + '&path=%2F' + config.nonExistentFile + '&password=' + config.testUserPassword
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: getFailureXmlPaginatedResponseWithCodeAndMessage(404, 'Wrong path, file/folder doesn\'t exist')
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a group share POST request with valid auth but non-existent file',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      headers: {
        authorization: 'Basic YWRtaW46YWRtaW4=',
        Origin: origin
      },
      body: 'shareType=1&shareWith=' + config.testGroup + '&path=%2F' + config.nonExistentFile + '&permissions=19'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': applicationWithXml,
        'Access-Control-Allow-Origin': origin
      },
      body: getFailureXmlPaginatedResponseWithCodeAndMessage(404, 'Wrong path, file/folder doesn\'t exist')
    }
  }))

  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request for a share with non-existent file',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      query: 'path=%2F' + config.nonExistentFile,
      headers: {
        authorization: 'Basic YWRtaW46YWRtaW4=',
        Origin: origin
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: getFailureXmlPaginatedResponseWithCodeAndMessage(404, 'Wrong path, file/folder doesn\'t exist')
    }
  })
  )
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request for an existent but non-shared file',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      query: 'path=%2FnewFileCreated123',
      headers: {
        authorization: 'Basic YWRtaW46YWRtaW4=',
        Origin: origin
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: getSuccessOcsResponseXmlBodyWithPagination(100)
    }
  })
  )
  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request for a non-existent share',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/-1$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/-1'
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: xmlResponseHeaders,
      body: getFailureXmlPaginatedResponseWithCodeAndMessage(404, 'Wrong share ID, share doesn\'t exist')
    }
  })
  )

  requests = ['PUT', 'DELETE']
  for (let i = 0; i < requests.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a ' + requests[i] + ' request to update/delete a non-existent share',
      withRequest: {
        method: requests[i],
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/-1$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/-1'
        }),
        headers: validAuthHeaders
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin
        },
        body: getFailureXmlPaginatedResponseWithCodeAndMessage(404, 'Wrong share ID, share doesn\'t exist')
      }
    }))
  }

  file = ['test.txt', 'test space and + and #.txt', '文件.txt']
  path = ['%2Ftest.txt', '%2Ftest+space+and+%2B+and+%23.txt', '%2F%E6%96%87%E4%BB%B6.txt']
  id = [14, 18, 19]
  for (i = 0; i < file.length; i++) {
    promises.push(provider.addInteraction({
      uponReceiving: 'a user share POST request with valid auth and expiration date set to path ' + path[i],
      withRequest: {
        method: 'POST',
        path: Pact.Matchers.term({
          matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
          generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
        }),
        headers: {
          authorization: 'Basic YWRtaW46YWRtaW4=',
          Origin: origin
        },
        body: 'shareType=0&shareWith=' + config.testUser + '&path=' + path[i] + '&expireDate=' + config.expirationDate
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': applicationWithXml,
          'Access-Control-Allow-Origin': origin
        },
        body: '<?xml version="1.0"?>\n' +
            '<ocs>\n' +
            ' <meta>\n' +
            '  <status>ok</status>\n' +
            '  <statuscode>100</statuscode>\n' +
            '  <message/>\n' +
            '  <totalitems></totalitems>\n' +
            '  <itemsperpage></itemsperpage>\n' +
            ' </meta>\n' +
            ' <data>\n' +
            '  <id>' + id[i] + '</id>\n' +
            '  <share_type>0</share_type>\n' +
            '  <uid_owner>admin</uid_owner>\n' +
            '  <displayname_owner>admin</displayname_owner>\n' +
            '  <permissions>19</permissions>\n' +
            '  <parent/>\n' +
            '  <expiration>2022-10-01 00:00:00</expiration>\n' +
            '  <token/>\n' +
            '  <uid_file_owner>admin</uid_file_owner>\n' +
            '  <displayname_file_owner>admin</displayname_file_owner>\n' +
            '  <additional_info_owner/>\n' +
            '  <additional_info_file_owner/>\n' +
            '  <path>' + file[i] + '</path>\n' +
            '  <item_type>file</item_type>\n' +
            '  <file_target>' + file[i] + '</file_target>\n' +
            '  <share_with>test123</share_with>\n' +
            '  <share_with_displayname>test123</share_with_displayname>\n' +
            '  <share_with_additional_info/>\n' +
            '  <attributes/>\n' +
            ' </data>\n' +
            '</ocs>'
      }
    })
    )
  }
  promises.push(provider.addInteraction({
    uponReceiving: 'a link share POST request with link name',
    withRequest: {
      method: 'POST',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares'
      }),
      headers: {
        authorization: 'Basic YWRtaW46YWRtaW4=',
        Origin: origin
      },
      body: 'shareType=3' + '&path=%2F' + config.testFolder + '&name=%C3%96ffentlicher+Link'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <id>9</id>\n' +
          '  <share_type>3</share_type>\n' +
          '  <uid_owner>admin</uid_owner>\n' +
          '  <displayname_owner>admin</displayname_owner>\n' +
          '  <permissions>1</permissions>\n' +
          '  <parent/>\n' +
          '  <expiration/>\n' +
          '  <uid_file_owner>admin</uid_file_owner>\n' +
          '  <displayname_file_owner>admin</displayname_file_owner>\n' +
          '  <additional_info_owner/>\n' +
          '  <additional_info_file_owner/>\n' +
          '  <path>/testFolder</path>\n' +
          '  <item_type>folder</item_type>\n' +
          '  <file_target>/testFolder</file_target>\n' +
          '  <name>Öffentlicher Link</name>\n' +
          '  <url>http://localhost/oc/s/H1wiMY2oDYmnWdC</url>\n' +
          '  <attributes/>\n' +
          ' </data>\n' +
          '</ocs>'
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'an invalid request to update the permissions of a public link share',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/\\d+$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/9'
      }),
      headers: validAuthHeaders,
      body: 'permissions=31'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin
      },
      body: getFailureXmlPaginatedResponseWithCodeAndMessage(400, 'Can\'t change permissions for public share links')
    }
  })
  )
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to update a public link share to public upload',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/\\d+$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/9'
      }),
      headers: validAuthHeaders,
      body: 'publicUpload=true'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin
      },
      body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <id>9</id>\n' +
          '  <share_type>3</share_type>\n' +
          '  <uid_owner>admin</uid_owner>\n' +
          '  <displayname_owner>admin</displayname_owner>\n' +
          '  <permissions>15</permissions>\n' +
          '  <parent/>\n' +
          '  <expiration/>\n' +
          '  <uid_file_owner>admin</uid_file_owner>\n' +
          '  <displayname_file_owner>admin</displayname_file_owner>\n' +
          '  <additional_info_owner/>\n' +
          '  <additional_info_file_owner/>\n' +
          '  <path>/testFolder</path>\n' +
          '  <item_type>folder</item_type>\n' +
          '  <file_target>/testFolder</file_target>\n' +
          '  <name>..ffentlicher Link</name>\n' +
          '  <url>http://localhost/oc/s/sXFMLABsGZ8Sirp</url>\n' +
          '  <attributes/>\n' +
          ' </data>\n' +
          '</ocs>'
    }
  })
  )

  promises.push(provider.addInteraction({
    uponReceiving: 'a GET request for a public link share',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/9$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/9'
      }),
      headers: {
        authorization: 'Basic YWRtaW46YWRtaW4=',
        Origin: origin
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': defaultAccessControlAllowMethods
      },
      body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <element>\n' +
          '   <id>17</id>\n' +
          '   <share_type>3</share_type>\n' +
          '   <uid_owner>admin</uid_owner>\n' +
          '   <displayname_owner>admin</displayname_owner>\n' +
          '   <permissions>1</permissions>\n' +
          '   <parent/>\n' +
          '   <expiration/>\n' +
          '   <uid_file_owner>admin</uid_file_owner>\n' +
          '   <displayname_file_owner>admin</displayname_file_owner>\n' +
          '   <additional_info_owner/>\n' +
          '   <additional_info_file_owner/>\n' +
          '   <path>/testFolder</path>\n' +
          '   <item_type>folder</item_type>\n' +
          '   <file_target>/testFolder</file_target>\n' +
          '   <share_with>***redacted***</share_with>\n' +
          '   <share_with_displayname>***redacted***</share_with_displayname>\n' +
          '   <name>..ffentlicher Link</name>\n' +
          '   <url>http://localhost/oc/s/0RygKBQRgM7QNuo</url>\n' +
          '   <attributes/>\n' +
          '  </element>\n' +
          ' </data>\n' +
          '</ocs>'
    }
  })
  )
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to delete a folder',
    withRequest: {
      method: 'DELETE',
      path: Pact.Matchers.term({
        matcher: '.*\\/remote\\.php\\/webdav\\/' + config.testFolder + '$',
        generate: '/remote.php/webdav/' + config.testFolder
      }),
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a request to update a public link share',
    withRequest: {
      method: 'PUT',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v1\\.php\\/apps\\/files_sharing\\/api\\/v1\\/shares\\/9$',
        generate: '/ocs/v1.php/apps/files_sharing/api/v1/shares/9'
      }),
      headers: validAuthHeaders,
      body: 'password=test123'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin
      },
      body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ' <meta>\n' +
          '  <status>ok</status>\n' +
          '  <statuscode>100</statuscode>\n' +
          '  <message/>\n' +
          '  <totalitems></totalitems>\n' +
          '  <itemsperpage></itemsperpage>\n' +
          ' </meta>\n' +
          ' <data>\n' +
          '  <id>9</id>\n' +
          '  <share_type>3</share_type>\n' +
          '  <uid_owner>admin</uid_owner>\n' +
          '  <displayname_owner>admin</displayname_owner>\n' +
          '  <permissions>1</permissions>\n' +
          '  <parent/>\n' +
          '  <expiration/>\n' +
          '  <uid_file_owner>admin</uid_file_owner>\n' +
          '  <displayname_file_owner>admin</displayname_file_owner>\n' +
          '  <additional_info_owner/>\n' +
          '  <additional_info_file_owner/>\n' +
          '  <path>/testFolder</path>\n' +
          '  <item_type>folder</item_type>\n' +
          '  <file_target>/testFolder</file_target>\n' +
          '  <share_with>***redacted***</share_with>\n' +
          '  <share_with_displayname>***redacted***</share_with_displayname>\n' +
          '  <name>..ffentlicher Link</name>\n' +
          '  <url>http://localhost/oc/s/3yxtgg2BhD2q2xq</url>\n' +
          '  <attributes/>\n' +
          ' </data>\n' +
          '</ocs>'
    }
  })
  )
  return promises
}

module.exports = { setGeneralInteractions }
