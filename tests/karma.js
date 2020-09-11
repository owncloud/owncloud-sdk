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
        uponReceiving: 'a capabilities GET request with valid username',
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
        uponReceiving: 'a capabilities GET request with invalid username',
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
        uponReceiving: 'a valid users GET request',
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
        uponReceiving: 'a single user GET request',
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
        uponReceiving: 'create user request',
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
        uponReceiving: 'create a user and add to a group in the same request',
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
        uponReceiving: 'update user request',
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
        uponReceiving: 'update unknown user request',
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
        uponReceiving: 'GET apps',
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
          uponReceiving: 'GET attributes of an app',
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
        uponReceiving: 'GET attributes of app when no values are set',
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
        uponReceiving: 'GET config request',
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
        uponReceiving: 'GET groups',
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
        uponReceiving: 'GET members of admin group',
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
        uponReceiving: 'DELETE a not existing group',
        withRequest: {
          method: 'DELETE',
          path: Pact.Matchers.term({
            matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/groups\\/' + config.nonExistingGroup + '$',
            generate: '/ocs/v1.php/cloud/groups/' + config.nonExistingGroup
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
        uponReceiving: 'GET groups of user',
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
        uponReceiving: 'GET groups that a user is subadmin of',
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
        uponReceiving: 'GET user information of an existing user',
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
        uponReceiving: 'GET user information of a not existing user',
        withRequest: {
          method: 'GET',
          path: Pact.Matchers.term({
            matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistingUser + '$',
            generate: '/ocs/v1.php/cloud/users/' + config.nonExistingUser
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
        uponReceiving: 'delete a user',
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
        uponReceiving: 'delete a not existing user',
        withRequest: {
          method: 'DELETE',
          path: Pact.Matchers.term({
            matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistingUser + '$',
            generate: '/ocs/v1.php/cloud/users/' + config.nonExistingUser
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
        uponReceiving: 'search all users',
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
        uponReceiving: 'search a user',
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
        uponReceiving: 'search for a not existing user',
        withRequest: {
          method: 'GET',
          path: Pact.Matchers.term({
            matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
            generate: '/ocs/v1.php/cloud/users'
          }),
          query: 'search=' + config.nonExistingUser,
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
        uponReceiving: 'get apps GET request with invalid auth',
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
        uponReceiving: 'enable apps POST request with invalid auth',
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
        uponReceiving: 'disable apps DELETE request with invalid auth',
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
        uponReceiving: 'unauthorized create group request',
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
        uponReceiving: 'an unauthorized group GET request',
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
        uponReceiving: 'an unauthorized admin group GET request',
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
        uponReceiving: 'unauthorized group DELETE request',
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
    .then(done, done.fail)
})
afterAll(function (done) {
  provider.finalize().then(done, done.fail)
})
