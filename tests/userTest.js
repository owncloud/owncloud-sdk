import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing user management,', function () {
  var config = require('./config/config.json')

  // PACT setup
  const {
    ocsMeta,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createUserInteraction,
    deleteUserInteraction,
    createUserWithGroupMembershipInteraction,
    createOwncloud,
    createProvider
  } = require('./pactHelper.js')
  const { validAdminAuthHeaders, xmlResponseHeaders, applicationFormUrlEncoded } = require('./pactHelper.js')

  const getUserInformationInteraction = async function (provider, requestName, username, responseBody) {
    if (username !== config.adminUsername && username !== config.nonExistentUser) {
      await provider
        .given('the user is recreated', { username: username, password: config.testUserPassword })
    }
    return provider
      .uponReceiving('a request to GET user information ' + requestName)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + username + '$',
          '/ocs/v1.php/cloud/users/' + username
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: responseBody
      })
  }

  const getUsersInteraction = function (provider, requestName, query, bodyData) {
    return provider
      .given('the user is recreated', { username: config.testUser, password: config.testUserPassword })
      .uponReceiving('a request to list all users ' + requestName)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users$',
          '/ocs/v1.php/cloud/users'
        ),
        query: query,
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            ocsMeta(meta, 'ok', 100)
          }).appendElement('data', '', bodyData)
        })
      })
  }

  const changeUserAttributeInteraction = async function (provider, requestName, username, requestBody, response) {
    if (username !== config.adminUsername && username !== config.nonExistentUser) {
      await provider
        .given('the user is recreated', { username: username, password: config.testUserPassword })
    }

    return provider
      .uponReceiving('set user attribute of ' + requestName)
      .withRequest({
        method: 'PUT',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + username,
          '/ocs/v1.php/cloud/users/' + username
        ),
        headers: {
          ...validAdminAuthHeaders,
          ...applicationFormUrlEncoded
        },
        body: requestBody
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8'
        },
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs
            .appendElement('meta', '', response)
            .appendElement('data', '', '')
        })
      })
  }

  const addUserToGroupInteraction = async function (provider, requestName, username, group) {
    let ocsStatusCode = 102
    if (username === config.nonExistentUser) {
      ocsStatusCode = 103
    }
    if (username !== config.adminUsername && username !== config.nonExistentUser) {
      await provider
        .given('the user is recreated', { username: username, password: config.testUserPassword })
    }
    if (group !== config.nonExistentGroup) {
      await provider
        .given('group exists', { groupName: group })
    }

    return provider
      .uponReceiving('add user to group ' + requestName)
      .withRequest({
        method: 'POST',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + username + '\\/groups$',
          '/ocs/v1.php/cloud/users/' + username + '/groups'
        ),
        headers:
          {
            ...validAdminAuthHeaders,
            ...applicationFormUrlEncoded
          },
        body: 'groupid=' + group
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs
            .appendElement('meta', '', meta => {
              ocsMeta(meta, 'failure', ocsStatusCode)
            })
            .appendElement('data', '', '')
        })
      })
  }

  const getGroupOfUserInteraction = async function (provider, requestName, username, responseBody) {
    if (username !== config.validAdminAuthHeaders && username !== config.nonExistentUser) {
      await provider
        .given('the user is recreated', { username: username, password: config.testUserPassword })
        .given('group exists', { groupName: config.testGroup })
        .given('user is added to group', { username: username, groupName: config.testGroup })
    }
    return provider
      .uponReceiving('a request to GET the groups that a user is a member of ' + requestName)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + username + '\\/groups$',
          '/ocs/v1.php/cloud/users/' + username + '/groups'
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: responseBody
      })
  }

  const removeUserFromGroupInteraction = async function (provider, requestName, username, group) {
    let ocsStatusCode = 102
    if (username === config.nonExistentUser) {
      ocsStatusCode = 103
    }
    if (username !== config.adminUsername && username !== config.nonExistentUser) {
      await provider
        .given('the user is recreated', { username: username, password: config.testUserPassword })
    }
    if (group !== config.nonExistentGroup) {
      await provider
        .given('group exists', { groupName: group })
    }
    return provider
      .uponReceiving('Remove user from a group ' + requestName)
      .withRequest({
        method: 'DELETE',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + username + '\\/groups$',
          '/ocs/v1.php/cloud/users/' + username + '/groups'
        ),
        headers:
          {
            ...validAdminAuthHeaders,
            ...applicationFormUrlEncoded
          },
        body: 'groupid=' + group
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            meta
              .appendElement('status', '', 'failure')
              .appendElement('statuscode', '', ocsStatusCode)
              .appendElement('message', '', '')
          }).appendElement('data', '', '')
        })
      })
  }

  const addUserToSubAdminGroupInteraction = async function (provider, request, username, group, responseOcsMeta) {
    if (username !== config.adminUsername && username !== config.nonExistentUser) {
      await provider
        .given('the user is recreated', { username: username, password: config.testUserPassword })
    }
    if (group !== config.nonExistentGroup) {
      await provider
        .given('group exists', { groupName: group })
    }
    return provider
      .uponReceiving('Add user to subadmin group ' + request)
      .withRequest({
        method: 'POST',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + username + '\\/subadmins$',
          '/ocs/v1.php/cloud/users/' + username + '/subadmins'
        ),
        headers:
          {
            ...validAdminAuthHeaders,
            ...applicationFormUrlEncoded
          },
        body: 'groupid=' + group
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', responseOcsMeta)
            .appendElement('data', '', '')
        })
      })
  }

  const getUsersSubAdminGroupsInteraction = async function (provider, requestName, username, responseBody) {
    if (username !== config.adminUsername && username !== config.nonExistentUser) {
      await provider
        .given('the user is recreated', { username: username, password: config.testUserPassword })
        .given('group exists', { groupName: config.testGroup })
        .given('user is made group subadmin', { username: username, groupName: config.testGroup })
    }
    return provider
      .uponReceiving('a request to GET groups that a user is a subadmin of ' + requestName)
      .withRequest({
        method: 'GET',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + username + '\\/subadmins$',
          '/ocs/v1.php/cloud/users/' + username + '/subadmins'
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: responseBody
      })
  }

  const getUserInformationOfNonExistentUserInteraction = function (provider) {
    return getUserInformationInteraction(
      provider,
      'of a non-existent user',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'failure', '998', 'The requested user could not be found')
          }).appendElement('data', '', '')
        })
    )
  }

  describe('added testUser to testGroup,', function () {
    it('checking method : getUserGroups with an existent user', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await getGroupOfUserInteraction(
        provider,
        ' with existent user',
        config.testUser,
        new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'ok', '100')
            }).appendElement('data', '', data => {
              data.appendElement('groups', '', groups => {
                groups.appendElement('element', '', config.testGroup)
              })
            })
          })
      )
      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.users.getUserGroups(config.testUser).then(data => {
          expect(typeof (data)).toEqual('object')
          expect(data.indexOf(config.testGroup)).toBeGreaterThan(-1)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('checking method : userIsInGroup with an existent user, existent group', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)

      await getGroupOfUserInteraction(
        provider,
        ' with existent user',
        config.testUser,
        new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'ok', '100')
            }).appendElement('data', '', data => {
              data.appendElement('groups', '', groups => {
                groups.appendElement('element', '', config.testGroup)
              })
            })
          })
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.users.userIsInGroup(config.testUser, config.testGroup).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })
  })

  describe('made testUser as testGroup subAdmin', function () {
    it('checking method : getUserSubadminGroups with an existent user', async function () {
      const provider = createProvider()
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)

      await getUsersSubAdminGroupsInteraction(
        provider,
        ' with an existent user',
        config.testUser,
        new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'ok', '100')
            }).appendElement('data', '', data => {
              data.appendElement('element', '', config.testGroup)
            })
          })
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.users.getUserSubadminGroups(config.testUser).then(data => {
          expect(typeof (data)).toEqual('object')
          expect(data.indexOf(config.testGroup)).toBeGreaterThan(-1)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })
  })

  it('checking method : getUser on an existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUserInformationInteraction(
      provider,
      'of an existing user',
      config.adminUsername,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', data => {
            data.appendElement('enabled', '', 'true')
              .appendElement('quota', '', quota => {
                quota
                  .appendElement('free', '', MatchersV3.number(57800708096))
                  .appendElement('used', '', MatchersV3.number(2740027))
                  .appendElement('total', '', MatchersV3.number(57803448123))
                  .appendElement('relative', '', '0')
                  .appendElement('definition', '', 'default')
              })
              .appendElement('email', '', '')
              .appendElement('displayname', '', config.adminUsername)
              .appendElement('two_factor_auth_enabled', '', 'false')
          })
        })
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUser(config.adminUsername).then(data => {
        expect(typeof (data)).toEqual('object')
        expect(data.displayname).toEqual(config.adminUsername)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : getUser on a non existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)

    await getUserInformationOfNonExistentUserInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUser(config.nonExistentUser).then(user => {
        expect(user).toBe(null)
      }).catch(error => {
        expect(error).toBe('The requested user could not be found')
      })
    })
  })

  it('checking method : createUser & deleteUser', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await createUserInteraction(provider)
    await deleteUserInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.createUser(config.testUser, config.testUserPassword).then(data => {
        expect(data).toEqual(true)
        return oc.users.deleteUser(config.testUser)
      }).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : createUser with groups', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await deleteUserInteraction(provider)
    await createUserWithGroupMembershipInteraction(provider)
    await getGroupOfUserInteraction(
      provider,
      ' with existent user',
      config.testUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', data => {
            data.appendElement('groups', '', groups => {
              groups.appendElement('element', '', config.testGroup)
            })
          })
        })
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.createUser(config.testUser, config.testUserPassword, [config.testGroup]).then((data) => {
        expect(data).toEqual(true)
        return oc.users.userIsInGroup(config.testUser, config.testGroup)
      }).then((status) => {
        expect(status).toBe(true)
        return oc.users.deleteUser(config.testUser)
      }).then((status) => {
        expect(status).toBe(true)
      }).catch((error) => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : searchUsers', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersInteraction(
      provider,
      'to get all users',
      {},
      data => {
        data.appendElement('users', '', users => {
          users.appendElement('element', '', config.adminUsername)
            .appendElement('element', '', config.testUser)
        })
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.searchUsers('').then(data => {
        expect(typeof (data)).toEqual('object')
        expect(data.indexOf(config.adminUsername)).toBeGreaterThan(-1)
        expect(data.indexOf(config.testUser)).toBeGreaterThan(-1)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : searchUsers with zero user results', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersInteraction(
      provider,
      'search for user that does not exists',
      { search: config.nonExistentUser },
      data => {
        data.appendElement('users', '', '')
      }
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.searchUsers(config.nonExistentUser).then(data => {
        expect(typeof (data)).toEqual('object')
        expect(data.length).toEqual(0)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : userExists with existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersInteraction(
      provider,
      'search for a user that exists',
      { search: config.adminUsername },
      data => {
        data.appendElement('users', '', users => {
          users.appendElement('element', '', config.adminUsername)
        })
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userExists(config.adminUsername).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : userExists with non existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersInteraction(
      provider,
      'search for a user that doesn\'t exists',
      { search: config.nonExistentUser },
      data => {
        data.appendElement('users', '', '')
      }
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userExists(config.nonExistentUser).then(status => {
        expect(status).toBe(false)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : setUserAttribute of an existent user, allowed attribute', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await changeUserAttributeInteraction(
      provider,
      'an existent user, attribute is allowed',
      config.testUser,
      'key=email&value=asd%40a.com',
      meta => {
        ocsMeta(meta, 'ok', 100)
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.setUserAttribute(config.testUser, 'email', 'asd@a.com').then(data => {
        expect(data).toEqual(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : setUserAttribute of an existent user, not allowed attribute', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await changeUserAttributeInteraction(
      provider,
      'an existent user, attribute is not allowed',
      config.testUser,
      'key=email&value=%C3%83%C2%A4%C3%83%C2%B6%C3%83%C2%BC%C3%83%C2%A4%C3%83%C2%A4_sfsdf%2B%24%25%2F)%25%26%3D',
      meta => {
        ocsMeta(meta, 'failure', 102)
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.setUserAttribute(config.testUser, 'email', 'äöüää_sfsdf+$%/)%&=')
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          // FULL REQUEST RESPONSE RETURNED
          expect(typeof (error)).toBe('object')
          expect(error.ocs.meta.statuscode).toEqual('102')
        })
    })
  })

  it('checking method : setUserAttribute of a non existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await changeUserAttributeInteraction(
      provider,
      'a non existent user',
      config.nonExistentUser,
      'key=email&value=asd%40a.com',
      meta => {
        ocsMeta(meta, 'failure', 101)
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.setUserAttribute(config.nonExistentUser, 'email', 'asd@a.com').then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('101')
      })
    })
  })

  it('checking method : addUserToGroup with existent user, non existent group', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await addUserToGroupInteraction(
      provider,
      'with an existent user and a non existent group',
      config.testUser,
      config.nonExistentGroup
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.addUserToGroup(config.testUser, config.nonExistentGroup)
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          // FULL RESPONSE IS RETURNED
          expect(typeof (error)).toBe('object')
          expect(error.ocs.meta.statuscode).toEqual('102')
        })
    })
  })

  it('checking method : addUserToGroup with non existent user, existent group', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await addUserToGroupInteraction(
      provider,
      'with a non-existent user and an existent group',
      config.nonExistentUser,
      config.testGroup
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.addUserToGroup(config.nonExistentUser, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('103')
      })
    })
  })

  it('checking method : getUserGroups with a non existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    getGroupOfUserInteraction(
      provider,
      ' non existing user',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'failure', '998')
          }).appendElement('data', '', '')
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUserGroups(config.nonExistentUser).then(data => {
        expect(typeof (data)).toBe('object')
        expect(data.length).toEqual(0)
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('998')
      })
    })
  })

  it('checking method : userIsInGroup with an existent user but a group the user isn\'t part of', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getGroupOfUserInteraction(
      provider,
      ' with existent user and group that user isn\'t part of ',
      config.testUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', data => {
            data.appendElement('groups', '', groups => {
              groups.appendElement('element', '', config.testGroup)
            })
          })
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userIsInGroup(config.testUser, 'admin').then(status => {
        expect(status).toEqual(false)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : userIsInGroup with an existent user, non existent group', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getGroupOfUserInteraction(
      provider,
      ' with existent user and nonexistant group',
      config.testUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', data => {
            data.appendElement('groups', '', groups => {
              groups.appendElement('element', '', config.testGroup)
            })
          })
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userIsInGroup(config.testUser, config.nonExistentGroup)
        .then(status => {
          expect(status).toEqual(false)
        }).catch(error => {
          expect(error).toBe(null)
        })
    })
  })

  it('checking method : userIsInGroup with a non existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getGroupOfUserInteraction(
      provider,
      ' with a non-existent user',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'failure', '998')
          }).appendElement('data', '', '')
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userIsInGroup(config.nonExistentUser, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('998')
      })
    })
  })

  it('checking method : getUser with an existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUserInformationInteraction(
      provider,
      'to get user attribute of an existent user, ' + config.testUser,
      config.testUser,

      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', data => {
            data.appendElement('enabled', '', 'true')
              .appendElement('quota', '', quota => {
                quota.appendElement('definition', '', 'default')
              })
              .appendElement('displayname', '', 'test123')
              .appendElement('two_factor_auth_enabled', '', 'false')
          })
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUser(config.testUser).then(data => {
        expect(typeof (data)).toEqual('object')
        expect(data.displayname).toEqual(config.testUser)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : getUser with a non existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUserInformationOfNonExistentUserInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUser(config.nonExistentUser).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toEqual('The requested user could not be found')
      })
    })
  })

  it('checking method : removeUserFromGroup with existent user, non existent group', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await removeUserFromGroupInteraction(
      provider,
      'with existent user and non-existent group',
      config.testUser,
      config.nonExistentGroup
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.removeUserFromGroup(config.testUser, config.nonExistentGroup)
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(typeof (error)).toBe('object')
          expect(error.ocs.meta.statuscode).toEqual('102')
        })
    })
  })

  it('checking method : removeUserFromGroup with non existent user, existent group', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await removeUserFromGroupInteraction(
      provider,
      'with a non-existent user and an existent group',
      config.nonExistentUser,
      config.testGroup
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.removeUserFromGroup(config.nonExistentUser, config.testGroup)
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(typeof (error)).toBe('object')
          expect(error.ocs.meta.statuscode).toEqual('103')
        })
    })
  })

  it('checking method : addUserToSubadminGroup with existent user, non existent group', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await addUserToSubAdminGroupInteraction(
      provider,
      'with existent user non existent group',
      config.testUser,
      config.nonExistentGroup,
      meta => {
        ocsMeta(meta, 'failure', 102, 'Group:' + config.nonExistentGroup + ' does not exist')
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.addUserToSubadminGroup(config.testUser, config.nonExistentGroup)
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error).toBe('Group:' + config.nonExistentGroup + ' does not exist')
        })
    })
  })

  it('checking method : addUserToSubadminGroup with non existent user, existent group', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await addUserToSubAdminGroupInteraction(
      provider,
      'with a non-existent user and an existent group',
      config.nonExistentUser,
      config.testGroup,
      meta => {
        ocsMeta(meta, 'failure', 101, 'User does not exist')
      }
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.addUserToSubadminGroup(config.nonExistentUser, config.testGroup).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(error).toBe('User does not exist')
      })
    })
  })

  it('checking method : getUserSubadminGroups with a non existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersSubAdminGroupsInteraction(
      provider,
      ' with a non-existent user',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'failure', '101', 'User does not exist')
          }).appendElement('data', '', '')
        })
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUserSubadminGroups(config.nonExistentUser).then(data => {
        expect(typeof (data)).toBe('object')
        expect(data.length).toEqual(0)
      }).catch(error => {
        expect(error).toBe('User does not exist')
      })
    })
  })

  it('checking method : userIsInSubadminGroup with existent user, non existent group', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersSubAdminGroupsInteraction(
      provider,
      ' with an existent user',
      config.testUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100')
          }).appendElement('data', '', data => {
            data.appendElement('element', '', config.testGroup)
          })
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userIsInSubadminGroup(config.testUser, config.nonExistentGroup)
        .then(status => {
          expect(status).toBe(false)
        }).catch(error => {
          expect(error).toBe(null)
        })
    })
  })

  it('checking method : userIsInSubadminGroup with non existent user, existent group', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersSubAdminGroupsInteraction(
      provider,
      ' with a non-existent user',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'failure', '101', 'User does not exist')
          }).appendElement('data', '', '')
        })
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userIsInSubadminGroup(config.nonExistentUser, config.testGroup)
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error).toBe('User does not exist')
        })
    })
  })

  it('checking method : deleteUser on a non existent user', async function () {
    const provider = createProvider()
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await provider
      .uponReceiving('a request to delete a non-existent user')
      .withRequest({
        method: 'DELETE',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '$',
          '/ocs/v1.php/cloud/users/' + config.nonExistentUser
        ),
        headers: validAdminAuthHeaders
      })
      .willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            ocsMeta(meta, 'failure', 101)
          }).appendElement('data', '', '')
        })
      })

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.deleteUser(config.nonExistentUser).then(status => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('101')
      })
    })
  })
})
