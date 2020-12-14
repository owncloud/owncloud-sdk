describe('Unauthorized: Currently testing user management,', function () {
  // CURRENT TIME
  var timeRightNow = new Date().getTime()
  var OwnCloud = require('../../src')
  var config = require('../config/config.json')

  // LIBRARY INSTANCE
  var oc

  // PACT setup
  const Pact = require('@pact-foundation/pact-web')
  const provider = new Pact.PactWeb()
  const { setGeneralInteractions, invalidAuthHeader } = require('../pactHelper.js')
  const { unauthorizedXmlResponseBody, origin } = require('../pactHelper.js')

  const request = function (requestName, method, path) {
    return {
      uponReceiving: requestName,
      withRequest: {
        method: method,
        path: path,
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
    }
  }

  const usersEndpointPath = Pact.Matchers.term({
    matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
    generate: '/ocs/v1.php/cloud/users'
  })

  const groupsEndpointPath = Pact.Matchers.term({
    matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/groups$',
    generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/groups'
  })

  const subadminsUserEndpointPath = Pact.Matchers.term({
    matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '\\/subadmins$',
    generate: '/ocs/v1.php/cloud/users/' + config.testUser + '/subadmins'
  })

  const testUserEndpointPath = Pact.Matchers.term({
    matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.testUser + '$',
    generate: '/ocs/v1.php/cloud/users/' + config.testUser
  })

  beforeAll(function (done) {
    const promises = []
    promises.push(setGeneralInteractions(provider))
    promises.push(provider.addInteraction(request(
      'a user GET request with invalid auth',
      'GET',
      usersEndpointPath
    )))
    promises.push(provider.addInteraction(request(
      'a group user GET request with invalid auth',
      'GET',
      groupsEndpointPath
    )))
    promises.push(provider.addInteraction(request(
      'a GET request with invalid auth to check if user is a subadmin of any groups',
      'GET',
      subadminsUserEndpointPath
    )))
    Promise.all(promises).then(done, done.fail)
  })

  afterAll(function (done) {
    provider.removeInteractions().then(done, done.fail)
  })

  // TESTING CONFIGS
  var testUserPassword = 'password'

  beforeEach(function () {
    oc = new OwnCloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password + timeRightNow
        }
      }
    })

    oc.login()
  })

  it('checking method : getUser', async function (done) {
    await provider.addInteraction(request(
      'a GET request with invalid auth to check for user admin',
      'GET',
      Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/admin$',
        generate: '/ocs/v1.php/cloud/users/admin'
      })
    ))
    oc.users.getUser(config.username).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : createUser', async function (done) {
    await provider.addInteraction(request(
      'a create user POST request with invalid auth',
      'POST',
      usersEndpointPath
    ))
    oc.users.createUser('newUser' + timeRightNow, testUserPassword).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : searchUsers', function (done) {
    oc.users.searchUsers('').then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : userExists', function (done) {
    oc.users.userExists(config.username).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : setUserAttribute', async function (done) {
    await provider.addInteraction(request(
      'a user PUT request with invalid auth',
      'PUT',
      testUserEndpointPath
    ))
    oc.users.setUserAttribute(config.testUser, 'email', 'asd@a.com').then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : addUserToGroup', async function (done) {
    await provider.addInteraction(request(
      'a user POST request with invalid auth to add user to group',
      'POST',
      groupsEndpointPath
    ))
    oc.users.addUserToGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getUserGroups', function (done) {
    oc.users.getUserGroups(config.testUser).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : userIsInGroup', function (done) {
    oc.users.userIsInGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getUser', async function (done) {
    await provider.addInteraction(request(
      'a GET request with invalid auth to check for user',
      'GET',
      testUserEndpointPath
    ))
    oc.users.getUser(config.testUser).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : removeUserFromGroup', async function (done) {
    await provider.addInteraction(request(
      'a DELETE request with invalid auth to remove user from group',
      'DELETE',
      groupsEndpointPath
    ))
    oc.users.removeUserFromGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : addUserToSubadminGroup', async function (done) {
    await provider.addInteraction(request(
      'a POST request with invalid auth to add user to subadmin group',
      'POST',
      subadminsUserEndpointPath
    ))
    oc.users.addUserToSubadminGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : getUserSubadminGroups', function (done) {
    oc.users.getUserSubadminGroups(config.testUser).then(data => {
      expect(data).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : userIsInSubadminGroup', function (done) {
    oc.users.userIsInSubadminGroup(config.testUser, config.testGroup).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })

  it('checking method : deleteUser', async function (done) {
    await provider.addInteraction(request(
      'a request to DELETE a non-existent user with invalid auth',
      'DELETE',
      Pact.Matchers.term({
        matcher: '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '$',
        generate: '/ocs/v1.php/cloud/users/' + config.nonExistentUser
      })
    ))
    oc.users.deleteUser(config.nonExistentUser).then(status => {
      expect(status).toBe(null)
      done()
    }).catch(error => {
      expect(error).toMatch('Unauthorised')
      done()
    })
  })
})
