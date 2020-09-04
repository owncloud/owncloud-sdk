require('../src')
var config = require('./config/config.json')

const context = require.context('.', true, /Test\.js$/)
context.keys().forEach(context)
var validUserPasswordHash = btoa(config.username + ':' + config.password)
var provider
const Pact = require('@pact-foundation/pact-web')

const accessControlAllowHeaders = 'OC-Checksum,OC-Total-Length,OCS-APIREQUEST,X-OC-Mtime,Accept,Authorization,Brief,Content-Length,Content-Range,Content-Type,Date,Depth,Destination,Host,If,If-Match,If-Modified-Since,If-None-Match,If-Range,If-Unmodified-Since,Location,Lock-Token,Overwrite,Prefer,Range,Schedule-Reply,Timeout,User-Agent,X-Expected-Entity-Length,Accept-Language,Access-Control-Request-Method,Access-Control-Allow-Origin,ETag,OC-Autorename,OC-CalDav-Import,OC-Chunked,OC-Etag,OC-FileId,OC-LazyOps,OC-Total-File-Length,Origin,X-Request-ID,X-Requested-With'
const origin = 'http://localhost:9876'
const validAuthHeaders = { authorization: 'Basic ' + validUserPasswordHash, Origin: origin }

beforeAll(function (done) {
  provider = new Pact.PactWeb()

  provider.removeInteractions().then(() =>
    provider.addInteraction({
      uponReceiving: 'any CORS preflight request',
      withRequest: {
        method: 'OPTIONS',
        path: Pact.Matchers.regex({
          matcher: '.*\\/ocs\\/v(1|2)\\.php\\/cloud\\/.*',
          generate: '/ocs/v1.php/cloud/capabilities'
        }),
        headers: {
          'Access-Control-Request-Method': Pact.Matchers.regex({
            matcher: 'GET|POST|PUT',
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
            authorization: Pact.Matchers.term({
              matcher: '^(?!Basic ' + validUserPasswordHash + ').*$', // match anything except a valid auth
              generate: 'Basic bm9uRXhpc3RpbmdVc2VycnByeXJxOHg2OmNvbmZpZy5wYXNzd29yZHJwcnlycTh4Ng=='
            }),
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
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': accessControlAllowHeaders
          }
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
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': accessControlAllowHeaders
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
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': accessControlAllowHeaders
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
            ' <data>\n' +
            '  <apps>\n' +
            '   <element>workflow</element>\n' +
            '   <element>files</element>\n' +
            '  </apps>\n' +
            ' </data>\n' +
            '</ocs>\n'
        }
      }))
    .then(done, done.fail)
})
afterAll(function (done) {
  provider.finalize().then(done, done.fail)
})
