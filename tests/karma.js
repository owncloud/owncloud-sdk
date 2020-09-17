require('../src')
var config = require('./config/config.json')
const utf8 = require('utf8')

const context = require.context('.', true, /Test\.js$/)
context.keys().forEach(context)
var validUserPasswordHash = btoa(config.username + ':' + config.password)
var provider
const Pact = require('@pact-foundation/pact-web')

const accessControlAllowHeaders = 'OC-Checksum,OC-Total-Length,OCS-APIREQUEST,X-OC-Mtime,Accept,Authorization,Brief,Content-Length,Content-Range,Content-Type,Date,Depth,Destination,Host,If,If-Match,If-Modified-Since,If-None-Match,If-Range,If-Unmodified-Since,Location,Lock-Token,Overwrite,Prefer,Range,Schedule-Reply,Timeout,User-Agent,X-Expected-Entity-Length,Accept-Language,Access-Control-Request-Method,Access-Control-Allow-Origin,ETag,OC-Autorename,OC-CalDav-Import,OC-Chunked,OC-Etag,OC-FileId,OC-LazyOps,OC-Total-File-Length,Origin,X-Request-ID,X-Requested-With'
const origin = 'http://localhost:9876'
const validAuthHeaders = { authorization: 'Basic ' + validUserPasswordHash, Origin: origin }
const ocsSuccessMeta = ' <meta>\n' +
                       '  <status>ok</status>\n' +
                       '  <statuscode>100</statuscode>\n' +
                       '  <message/>\n' +
                       ' </meta>\n'
const xmlResponseHeaders = { 'Content-Type': 'text/xml; charset=utf-8', 'Access-Control-Allow-Origin': origin }

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

beforeAll(function (done) {
  provider = new Pact.PactWeb()

  provider.removeInteractions().then(() =>
    provider.addInteraction({
      uponReceiving: 'any CORS preflight request',
      withRequest: {
        method: 'OPTIONS',
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/.*',
          generate: '/ocs/v1.php/cloud/capabilities'
        }),
        headers: {
          'Access-Control-Request-Method': Pact.Matchers.regex({
            matcher: 'GET|POST|PUT|DELETE',
            generate: 'GET'
          })
        }
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': accessControlAllowHeaders,
          'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
        }
      }
    }))
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
            'Content-Type': 'application/xml; charset=utf-8',
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
            generate: '<?xml version="1.0"?>\n' +
              '<ocs>\n' +
              ' <meta>\n' +
              '  <status>ok</status>\n' +
              '  <statuscode>100</statuscode>\n' +
              '  <message>OK</message>\n' +
              '  <totalitems></totalitems>\n' +
              '  <itemsperpage></itemsperpage>\n' +
              ' </meta>\n' +
              ' <data>\n' +
              '  <id>admin</id>\n' +
              '  <display-name>admin</display-name>\n' +
              '  <email></email>\n' +
              ' </data>\n' +
              '</ocs>'
          })
        }
      }))
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            '  <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
          body: { key: 'email', value: 'foo@bar.net' }
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
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: '<?xml version="1.0"?>\n' +
            '<ocs>\n' +
            ' <meta>\n' +
            '  <status>ok</status>\n' +
            '  <statuscode>100</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>ok</status>\n' +
            '  <statuscode>100</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
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
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: '<?xml version="1.0"?>\n' +
            '<ocs>\n' +
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>102</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: '<?xml version="1.0"?>\n' +
            '<ocs>\n' +
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>997</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>102</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>102</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>998</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>102</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>102</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>102</statuscode>\n' +
            '  <message>Group:thisGroupShouldNotExist does not exist</message>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>101</statuscode>\n' +
            '  <message>User does not exist</message>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>101</statuscode>\n' +
            '  <message>User does not exist</message>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            ' <data>\n' +
            '  <apps>\n' +
            '   <element>workflow</element>\n' +
            '   <element>files</element>\n' +
            '  </apps>\n' +
            ' </data>\n' +
            '</ocs>\n'
        }
      }))
    .then(() => {
      var attributes = {
        attr1: { attrExists: true, value: 'value1' },
        'attr+plus space': { attrExists: true, value: 'value+plus space and/slash' },
        属性1: { attrExists: true, value: '值对1' },
        'attr ': { attrExists: false, value: '' },
        'attr+plus space ': { attrExists: false, value: '' },
        '属性1 ': { attrExists: false, value: '' },
        '': {
          attrExists: false,
          value: {
            attr1: 'value1',
            'attr+plus space': 'value+plus space and/slash',
            属性1: '值对1'
          }
        },
        'attr1-no-value': { attrExists: true, value: '' },
        'attr+plus space-no-value': { attrExists: true, value: '' },
        '属性1-no-value': { attrExists: true, value: '' }
      }
      const promises = []
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
          uponReceiving: 'a request to GET attributes of an app',
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
      return Promise.all(promises)
    })

    .then(() => {
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
      return provider.addInteraction({
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
      })
    })
    .then(() => {
      const promises = []
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
                 ocsSuccessMeta +
                ' <data/>\n' +
                '</ocs>'
          }
        }))
      }
      return Promise.all(promises)
    })
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
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
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            ' <data>\n' +
            '  <groups>\n' +
            '   <element>admin</element>\n' +
            '   <element>' + config.testGroup + '</element>\n' +
            '  </groups>\n' +
            ' </data>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            ' <data>\n' +
            '  <users>\n' +
            '   <element>admin</element>\n' +
            '  </users>\n' +
            ' </data>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>101</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            ' <data>\n' +
            '  <groups>\n' +
            '   <element>' + config.testGroup + '</element>\n' +
            '  </groups>\n' +
            ' </data>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            ' <data>\n' +
            '   <element>' + config.testGroup + '</element>\n' +
            ' </data>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
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
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>998</statuscode>\n' +
            '  <message>The requested user could not be found</message>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            '  <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>failure</status>\n' +
            '  <statuscode>101</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            '  <data/>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            ' <data>\n' +
            '  <users>\n' +
            '   <element>' + config.username + '</element>\n' +
            '   <element>' + config.testUser + '</element>\n' +
            '  </users>\n' +
            ' </data>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            ' <data>\n' +
            '  <users>\n' +
            '   <element>' + config.username + '</element>\n' +
            '  </users>\n' +
            ' </data>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ocsSuccessMeta +
            ' <data>\n' +
            '  <users/>\n' +
            ' </data>\n' +
            '</ocs>\n'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Content-Type': 'text/xml; charset=utf-8',
            'Access-Control-Allow-Origin': origin
          },
          body: '<?xml version="1.0"?>\n' +
            '<ocs>\n' +
            ' <meta>\n' +
            '  <status>ok</status>\n' +
            '  <statuscode>100</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            ' <meta>\n' +
            '  <status>ok</status>\n' +
            '  <statuscode>100</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Content-Type': 'text/xml; charset=utf-8',
            'Access-Control-Allow-Origin': origin
          },
          body: '<?xml version="1.0"?>\n' +
            '<ocs>\n' +
            ' <meta>\n' +
            '  <status>ok</status>\n' +
            '  <statuscode>100</statuscode>\n' +
            '  <message/>\n' +
            ' </meta>\n' +
            ' <data/>\n' +
            '</ocs>'
        }
      }))
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() => {
      var key = ['attr1', 'attr%2Bplus%20space', '%C3%A5%C2%B1%C2%9E%C3%A6%C2%80%C2%A71']
      for (var i = 0; i < key.length; i++) {
        provider.addInteraction({
          uponReceiving: 'get attributes GET apps request with invalid auth',
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
        })
      }
    })
    .then(() => {
      var key = ['attr1', 'attr%2Bplus%20space', '%C3%A5%C2%B1%C2%9E%C3%A6%C2%80%C2%A71']
      var value = ['value1', 'value%2Bplus+space+and%2Fslash', '%C3%A5%C2%80%C2%BC%C3%A5%C2%AF%C2%B91']
      for (var i = 0; i < key.length; i++) {
        provider.addInteraction({
          uponReceiving: 'set attributes POST apps request with invalid auth',
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
        })
      }
    })
    .then(() => {
      var key = ['attr1', 'attr%2Bplus%20space', '%C3%A5%C2%B1%C2%9E%C3%A6%C2%80%C2%A71']
      for (var i = 0; i < key.length; i++) {
        provider.addInteraction({
          uponReceiving: 'delete attributes POST apps request with invalid auth',
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
        })
      }
    })
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: unauthorizedXmlResponseBody
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: unauthorizedXmlResponseBody
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: unauthorizedXmlResponseBody
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: unauthorizedXmlResponseBody
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: unauthorizedXmlResponseBody
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: unauthorizedXmlResponseBody
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: unauthorizedXmlResponseBody
        }
      }))
    .then(() =>
      provider.addInteraction({
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT'
          },
          body: unauthorizedXmlResponseBody
        }
      }))
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
    .then(() =>
      provider.addInteraction({
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
            'Content-Type': 'application/xml; charset=utf-8',
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
            '  <path>/......123.txt</path>\n' +
            '  <item_type>file</item_type>\n' +
            '  <mimetype>text/plain</mimetype>\n' +
            '  <storage_id>home::admin</storage_id>\n' +
            '  <storage>1</storage>\n' +
            '  <item_source>2147498361</item_source>\n' +
            '  <file_source>2147498361</file_source>\n' +
            '  <file_parent>3</file_parent>\n' +
            '  <file_target>/......123.txt</file_target>\n' +
            '  <share_with>test123</share_with>\n' +
            '  <share_with_displayname>test123</share_with_displayname>\n' +
            '  <share_with_additional_info/>\n' +
            '  <mail_send>0</mail_send>\n' +
            '  <attributes>[{&quot;scope&quot;:&quot;ownCloud&quot;,&quot;key&quot;:&quot;read&quot;,&quot;enabled&quot;:&quot;true&quot;},{&quot;scope&quot;:&quot;ownCloud&quot;,&quot;key&quot;:&quot;share&quot;,&quot;enabled&quot;:&quot;true&quot;}]</attributes>\n' +
            ' </data>\n' +
            '</ocs>'
        }
      }))
    .then(() =>
      provider.addInteraction({
        uponReceiving: 'remote.php webdav options request',
        withRequest: {
          method: 'OPTIONS',
          path: Pact.Matchers.regex({
            matcher: '.*\\/remote\\.php\\/webdav\\/.*',
            generate: '/remote.php/webdav/' + config.testFile
          }),
          headers: {
            'Access-Control-Request-Method': 'PUT'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': accessControlAllowHeaders,
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,MKCOL,PROPFIND,PATCH,PROPPATCH,REPORT,HEAD,COPY,MOVE'
          }
        }
      }))
    .then(() =>
      provider.addInteraction({
        uponReceiving: 'Put file contents',
        withRequest: {
          method: 'PUT',
          path: Pact.Matchers.regex({
            matcher: '.*\\/remote\\.php\\/webdav\\/.*',
            generate: '/remote.php/webdav/' + config.testFile
          }),
          headers: validAuthHeaders,
          body: '123456'
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': origin
          }
        }
      }))
    .then(done, done.fail)
})
afterAll(function (done) {
  provider.finalize().then(done, done.fail)
})
