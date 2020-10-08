var config = require('./config/config.json')
const utf8 = require('utf8')

var validUserPasswordHash = btoa(config.username + ':' + config.password)
const Pact = require('@pact-foundation/pact-web')

const accessControlAllowHeaders = 'OC-Checksum,OC-Total-Length,OCS-APIREQUEST,X-OC-Mtime,Accept,Authorization,Brief,Content-Length,Content-Range,Content-Type,Date,Depth,Destination,Host,If,If-Match,If-Modified-Since,If-None-Match,If-Range,If-Unmodified-Since,Location,Lock-Token,Overwrite,Prefer,Range,Schedule-Reply,Timeout,User-Agent,X-Expected-Entity-Length,Accept-Language,Access-Control-Request-Method,Access-Control-Allow-Origin,ETag,OC-Autorename,OC-CalDav-Import,OC-Chunked,OC-Etag,OC-FileId,OC-LazyOps,OC-Total-File-Length,Origin,X-Request-ID,X-Requested-With'
const accessControlAllowMethods = 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT,COPY,MOVE,HEAD'
const origin = 'http://localhost:9876'
const validAuthHeaders = {
  authorization: 'Basic ' + validUserPasswordHash,
  Origin: origin
}

const ocsMeta = function (status, statusCode, Message = null) {
  if (Message == null) {
    return ' <meta>\n' +
      '  <status>' + status + '</status>\n' +
      '  <statuscode>' + statusCode + '</statuscode>\n' +
      '  <message/>\n' +
      ' </meta>\n'
  }
  return ' <meta>\n' +
    '  <status>' + status + '</status>\n' +
    '  <statuscode>' + statusCode + '</statuscode>\n' +
    '  <message>' + Message + '</message>\n' +
    ' </meta>\n'
}

const shareResponseOcsData = function (shareType, id, permissions, fileTarget) {
  const data = '  <id>' + id + '</id>\n' +
    '  <share_type>' + shareType + '</share_type>\n' +
    '  <uid_owner>admin</uid_owner>\n' +
    '  <displayname_owner>admin</displayname_owner>\n' +
    '  <permissions>' + permissions + '</permissions>\n' +
    '  <uid_file_owner>admin</uid_file_owner>\n' +
    '  <displayname_file_owner>admin</displayname_file_owner>\n' +
    '  <path>' + fileTarget + '</path>\n' +
    '  <file_target>' + fileTarget + '</file_target>\n'

  if (shareType === 3) {
    return data +
      '  <url>' + config.owncloudURL + '/s/yrkoLeS33y1aTya</url>\n'
  }
  return data
}

const applicationXmlResponseHeaders = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Access-Control-Allow-Origin': origin
}

const xmlResponseHeaders = {
  'Content-Type': 'text/xml; charset=utf-8',
  'Access-Control-Allow-Origin': origin
}

const invalidAuthHeader = Pact.Matchers.term({
  matcher: '^(?!Basic ' + validUserPasswordHash + ').*$', // match anything except a valid auth
  generate: 'Basic bm9uRXhpc3RpbmdVc2VycnByeXJxOHg2OmNvbmZpZy5wYXNzd29yZHJwcnlycTh4Ng=='
})

const unauthorizedXmlResponseBody = '<?xml version="1.0"?>\n' +
  '<ocs>\n' +
  ' <meta>\n' +
  '  <status>failure</status>\n' +
  '  <statuscode>997</statuscode>\n' +
  '  <message>Unauthorised</message>\n' +
  ' </meta>\n' +
  ' <data/>\n' +
  '</ocs>'

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
          matcher: 'GET|POST|PUT|DELETE|MKCOL|PROPFIND|MOVE|COPY',
          generate: 'GET'
        })
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': accessControlAllowHeaders,
        'Access-Control-Allow-Methods': accessControlAllowMethods
      }
    }
  }))
  promises.push(provider.addInteraction({
    uponReceiving: 'a capabilities GET request with valid authentication',
    withRequest: {
      method: 'GET',
      path: Pact.Matchers.regex({
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/capabilities',
        generate: '/ocs/v1.php/cloud/capabilities'
      }),
      query: 'format=json',
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
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
        matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/capabilities',
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
        'Content-Type': 'application/json; charset=utf-8',
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
      headers: applicationXmlResponseHeaders,
      body: Pact.Matchers.term({
        matcher: '<\\?xml version="1\\.0"\\?>\\s' +
          '<ocs>\\s' +
          ocsMeta('ok', 100, 'OK') +
          ' <data>\\s' +
          '  <id>admin<\\/id>\\s' +
          '  <display-name>admin<\\/display-name>\\s' +
          '  <email><\\/email>\\s.*' +
          ' <\\/data>\\s' +
          '<\\/ocs>',
        generate: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ocsMeta('ok', 100, 'OK') +
          ' <data>\n' +
          '  <id>admin</id>\n' +
          '  <display-name>admin</display-name>\n' +
          '  <email></email>\n' +
          ' </data>\n' +
          '</ocs>'
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
        'Content-Type': 'application/json; charset=utf-8',
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        '  <data/>\n' +
        '</ocs>\n'
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data/>\n' +
        '</ocs>'
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
        'Content-Type': 'text/xml; charset=utf-8'
      },
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '  <enabled>true</enabled>\n' +
        '  <quota>\n' +
        '   <definition>default</definition>\n' +
        '  </quota>\n' +
        '  <email>asd@a.com</email>\n' +
        '  <displayname>test123</displayname>\n' +
        '  <two_factor_auth_enabled>false</two_factor_auth_enabled>\n' +
        ' </data>\n' +
        '</ocs>'
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 102) +
        ' <data/>\n' +
        '</ocs>\n'
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 997) +
        ' <data/>\n' +
        '</ocs>'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 102) +
        ' <data/>\n' +
        '</ocs>'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 102) +
        ' <data/>\n' +
        '</ocs>'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 998) +
        ' <data/>\n' +
        '</ocs>'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 102) +
        ' <data/>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 102) +
        ' <data/>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 102, 'Group:thisGroupShouldNotExist does not exist') +
        ' <data/>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 101, 'User does not exist') +
        ' <data/>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 101, 'User does not exist') +
        ' <data/>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '  <apps>\n' +
        '   <element>workflow</element>\n' +
        '   <element>files</element>\n' +
        '  </apps>\n' +
        ' </data>\n' +
        '</ocs>\n'
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
          ocsMeta('ok', '100') +
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
        ocsMeta('ok', '100') +
        data +
        '</ocs>'
    }
  }))

  const requests = ['POST', 'DELETE']
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
          ocsMeta('ok', '100') +
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '  <version>1.7</version>\n' +
        '  <website>ownCloud</website>\n' +
        '  <host>localhost</host>\n' +
        '  <contact></contact>\n' +
        '  <ssl>false</ssl>\n' +
        ' </data>\n' +
        '</ocs>'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '  <groups>\n' +
        '   <element>admin</element>\n' +
        '   <element>' + config.testGroup + '</element>\n' +
        '  </groups>\n' +
        ' </data>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '  <users>\n' +
        '   <element>admin</element>\n' +
        '  </users>\n' +
        ' </data>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 101) +
        ' <data/>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '  <groups>\n' +
        '   <element>' + config.testGroup + '</element>\n' +
        '  </groups>\n' +
        ' </data>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '   <element>' + config.testGroup + '</element>\n' +
        ' </data>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
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
        '  <two_factor_auth_enabled>false</two_factor_auth_enabled>\n' +
        ' </data>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 998, 'The requested user could not be found') +
        ' <data/>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        '  <data/>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('failure', 101) +
        '  <data/>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '  <users>\n' +
        '   <element>' + config.username + '</element>\n' +
        '   <element>' + config.testUser + '</element>\n' +
        '  </users>\n' +
        ' </data>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '  <users>\n' +
        '   <element>' + config.username + '</element>\n' +
        '  </users>\n' +
        ' </data>\n' +
        '</ocs>\n'
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
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        '  <users/>\n' +
        ' </data>\n' +
        '</ocs>\n'
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
      headers: validAuthHeaders,
      body: 'groupid=' + config.testGroup
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data/>\n' +
        '</ocs>'
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data/>\n' +
        '</ocs>'
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
      headers: validAuthHeaders,
      body: 'undefined=undefined'
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data/>\n' +
        '</ocs>'
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
      headers: validAuthHeaders
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
          'Content-Type': 'text/xml; charset=utf-8',
          'Access-Control-Allow-Origin': origin
        },
        body: unauthorizedXmlResponseBody
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
          'Content-Type': 'text/xml; charset=utf-8',
          'Access-Control-Allow-Origin': origin
        },
        body: unauthorizedXmlResponseBody
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
          'Content-Type': 'text/xml; charset=utf-8',
          'Access-Control-Allow-Origin': origin
        },
        body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: unauthorizedXmlResponseBody
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
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: unauthorizedXmlResponseBody
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
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: unauthorizedXmlResponseBody
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
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: unauthorizedXmlResponseBody
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
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: unauthorizedXmlResponseBody
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
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: unauthorizedXmlResponseBody
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
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: unauthorizedXmlResponseBody
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
        'Access-Control-Allow-Methods': accessControlAllowMethods
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': origin
      },
      body: unauthorizedXmlResponseBody
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
      headers: applicationXmlResponseHeaders,
      body: '<?xml version="1.0"?>\n' +
        '<ocs>\n' +
        ocsMeta('ok', '100') +
        ' <data>\n' +
        shareResponseOcsData(0, 7, 17, config.testFile) +
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
        'Content-Type': 'text/html; charset=utf-8',
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
        'Content-Type': 'text/html; charset=utf-8',
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
      headers: applicationXmlResponseHeaders,
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

  let files = ['test.txt', '%E6%96%87%E4%BB%B6.txt', 'test%20space%20and%20%2B%20and%20%23.txt', 'newFileCreated123']
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
        body: '<?xml version="1.0"?>\n' +
          '<ocs>\n' +
          ocsMeta('ok', '100') +
          ' <data/>\n' +
          '</ocs>'
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
  return promises
}

module.exports = {
  setGeneralInteractions,
  ocsMeta,
  shareResponseOcsData,
  origin,
  validAuthHeaders,
  invalidAuthHeader,
  xmlResponseHeaders,
  applicationXmlResponseHeaders,
  accessControlAllowHeaders,
  accessControlAllowMethods
}
