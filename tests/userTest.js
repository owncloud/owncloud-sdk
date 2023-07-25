import { MatchersV3, XmlBuilder } from '@pact-foundation/pact/v3'

describe('Main: Currently testing user management,', function () {
  var config = require('./config/config.json')
  const {
    admin: { username: adminUsername, displayname: adminDisplayName },
    testUser1: { username: testUser, password: testUserPassword }
  } = require('./config/users.json')

  // PACT setup
  const {
    ocsMeta,
    getCapabilitiesInteraction,
    getCurrentUserInformationInteraction,
    createUserInteraction,
    deleteUserInteraction,
    createUserWithGroupMembershipInteraction,
    createOwncloud,
    createProvider,
    validAdminAuthHeaders,
    xmlResponseHeaders,
    applicationFormUrlEncoded
  } = require('./helpers/pactHelper.js')

  const {
    givenGroupExists,
    givenUserExists,
    givenUserDoesNotExist,
    givenUserIsMadeGroupSubadmin,
    givenUserIsAddedToGroup
  } = require('./helpers/providerStateHelper')

  const getUserInformationInteraction = async function (provider, requestName, username, responseBody) {
    if (username !== adminUsername && username !== config.nonExistentUser) {
      await givenUserExists(provider, username)
    }
    return provider
      .uponReceiving(`as '${adminUsername}', a GET request to ${requestName}`)
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

  const getUsersInteraction = async function (provider, requestName, query, bodyData) {
    await givenUserExists(provider, testUser)
    return provider
      .uponReceiving(`as '${adminUsername}', a GET request to ${requestName}`)
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
            ocsMeta(meta, 'ok', 100, MatchersV3.regex('(OK)?', ''))
          }).appendElement('data', '', bodyData)
        })
      })
  }

  const changeUserAttributeInteraction = async function (provider, requestName, username, requestBody, response) {
    if (username !== adminUsername && username !== config.nonExistentUser) {
      await givenUserExists(provider, username)
    }

    return provider
      .uponReceiving(`as '${adminUsername}', a PUT request to set user attribute of ${requestName}`)
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
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs').build(ocs => {
          ocs
            .appendElement('meta', '', response)
        })
      })
  }

  const addUserToGroupInteraction = async function (provider, requestName, username, group) {
    let ocsStatusCode = 102
    let message = 'The requested group could not be found'
    if (username === config.nonExistentUser) {
      ocsStatusCode = 103
      message = 'The requested user could not be found'
    }
    if (username !== adminUsername && username !== config.nonExistentUser) {
      await givenUserExists(provider, username)
    }
    if (group !== config.nonExistentGroup) {
      await givenGroupExists(provider, group)
    }

    return provider
      .uponReceiving(`as '${adminUsername}', a POST request to ${requestName}`)
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
              // [oCIS] Different ocs status-text and status-code in oCIS and oC10
              // https://github.com/owncloud/ocis/issues/1777
              ocsMeta(
                meta,
                'failure',
                ocsStatusCode,
                MatchersV3.regex(`(${message})?`, '')
              )
            })
        })
      })
  }

  const getGroupOfUserInteraction = async function (provider, requestName, username, responseBody) {
    if (username !== adminUsername && username !== config.nonExistentUser) {
      await givenUserExists(provider, username)
      await givenGroupExists(provider, config.testGroup)
      await givenUserIsAddedToGroup(provider, username, config.testGroup)
    }
    return provider
      .uponReceiving(`as '${adminUsername}', a GET request to get groups of ${requestName}`)
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
    let message = 'The requested group could not be found'
    if (username === config.nonExistentUser) {
      ocsStatusCode = 103
      message = 'The requested user could not be found'
    }
    if (username !== adminUsername && username !== config.nonExistentUser) {
      await givenUserExists(provider, username)
    }
    if (group !== config.nonExistentGroup) {
      await givenGroupExists(provider, group)
    }
    return provider
      .uponReceiving(`as '${adminUsername}', a DELETE request to remove ${requestName}`)
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
            // [oCIS] Different ocs status-text and status-code in oCIS and oC10
            // https://github.com/owncloud/ocis/issues/1777
            meta
              .appendElement('status', '', MatchersV3.equal('failure'))
              .appendElement('statuscode', '', MatchersV3.equal(ocsStatusCode))
              .appendElement('message', '', MatchersV3.regex(`(${message})?`, ''))
          })
        })
      })
  }

  const addUserToSubAdminGroupInteraction = async function (provider, requestName, username, group, responseOcsMeta) {
    if (username !== adminUsername && username !== config.nonExistentUser) {
      await givenUserExists(provider, username)
    }
    if (group !== config.nonExistentGroup) {
      await givenGroupExists(provider, group)
    }
    return provider
      .uponReceiving(`as '${adminUsername}', a POST request to make ${requestName}`)
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
        })
      })
  }

  const getUsersSubAdminGroupsInteraction = async function (provider, requestName, username, responseBody) {
    if (username !== adminUsername && username !== config.nonExistentUser) {
      await givenUserExists(provider, username)
      await givenGroupExists(provider, config.testGroup)
      await givenUserIsMadeGroupSubadmin(provider, username, config.testGroup)
    }
    return provider
      .uponReceiving(`as '${adminUsername}', a GET request to get subadmin groups of ${requestName}`)
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
      'get user information of a non-existent user',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            // [oCIS] Different ocs status-text and status-code in oCIS and oC10
            // https://github.com/owncloud/ocis/issues/1777
            return ocsMeta(meta, 'failure', '998', 'The requested user could not be found')
          })
        })
    )
  }

  describe('add user to group,', function () {
    it('checking method : getUserGroups with an existent user', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)
      await getGroupOfUserInteraction(
        provider,
        'existent user',
        testUser,
        new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
            }).appendElement('data', '', data => {
              // TODO: adjust the following after the issue is resolved
              // https://github.com/pact-foundation/pact-js/issues/619
              data.appendElement('groups', '', groups => {
                groups.eachLike('element', '', group => {
                  group.appendText(MatchersV3.equal(config.testGroup))
                })
              })
            })
          })
      )
      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.users.getUserGroups(testUser).then(data => {
          expect(typeof (data)).toEqual('object')
          expect(data.indexOf(config.testGroup)).toBeGreaterThan(-1)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })

    it('checking method : userIsInGroup with an existent user, existent group', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)

      await getGroupOfUserInteraction(
        provider,
        'existent user',
        testUser,
        new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'ok', '100')
            }).appendElement('data', '', data => {
              data.appendElement('groups', '', groups => {
                groups.appendElement('element', '', MatchersV3.equal(config.testGroup))
              })
            })
          })
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.users.userIsInGroup(testUser, config.testGroup).then(status => {
          expect(status).toBe(true)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })
  })

  // [oCIS] subadmin endpoint not implemented
  // https://github.com/owncloud/product/issues/289
  describe('made user as group subAdmin', function () {
    it('checking method : getUserSubadminGroups with an existent user', async function () {
      const provider = createProvider(false, true)
      await getCapabilitiesInteraction(provider)
      await getCurrentUserInformationInteraction(provider)

      await getUsersSubAdminGroupsInteraction(
        provider,
        'an existent user',
        testUser,
        new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'ok', '100')
            }).appendElement('data', '', data => {
              data.appendElement('element', '', MatchersV3.equal(config.testGroup))
            })
          })
      )

      return provider.executeTest(async () => {
        const oc = createOwncloud()
        await oc.login()
        return oc.users.getUserSubadminGroups(testUser).then(data => {
          expect(typeof (data)).toEqual('object')
          expect(data.indexOf(config.testGroup)).toBeGreaterThan(-1)
        }).catch(error => {
          expect(error).toBe(null)
        })
      })
    })
  })

  it('checking method : getUser on an existent user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUserInformationInteraction(
      provider,
      'get user information of an existing user',
      adminUsername,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
          }).appendElement('data', '', data => {
            data.appendElement('enabled', '', MatchersV3.equal('true'))
              .appendElement('quota', '', quota => {
                quota
                  .appendElement('free', '', MatchersV3.number(57800708096))
                  .appendElement('used', '', MatchersV3.number(2740027))
                  .appendElement('total', '', MatchersV3.number(57803448123))
                  .appendElement('relative', '', MatchersV3.number(0))
                  .appendElement('definition', '', MatchersV3.equal('default'))
              })
              .appendElement(
                'email', '',
                MatchersV3.regex(
                  `(${adminUsername}@example.org)?`,
                  `${adminUsername}@example.org`
                )
              )
              .appendElement(
                'displayname', '',
                MatchersV3.regex(
                  `(${adminUsername}|${adminDisplayName})`,
                  adminUsername
                )
              )
          })
        })
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUser(adminUsername).then(data => {
        expect(typeof (data)).toEqual('object')
        expect(data.displayname).toEqual(adminUsername)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : getUser on a non existent user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)

    await getUserInformationOfNonExistentUserInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUser(config.nonExistentUser).then(user => {
        expect(user).toBe(null)
      }).catch(error => {
        expect(error.message).toBe('The requested user could not be found')
      })
    })
  })

  it('checking method : createUser & deleteUser', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await createUserInteraction(provider)
    await deleteUserInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.createUser(testUser, testUserPassword).then(data => {
        expect(data).toEqual(true)
        return oc.users.deleteUser(testUser)
      }).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  // 'createUser' doesn't accept email parameter
  // [oCIS] email is needed for oCIS to create users
  it('checking method : createUser with groups', async function () {
    const provider = createProvider(false, true)
    await givenUserDoesNotExist(provider, testUser)

    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await createUserWithGroupMembershipInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.createUser(testUser, testUserPassword, [config.testGroup]).then((data) => {
        expect(data).toEqual(true)
      }).catch((error) => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : searchUsers', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersInteraction(
      provider,
      'search a user',
      {},
      data => {
        // TODO: adjust the following after the issue is resolved
        // https://github.com/pact-foundation/pact-js/issues/619
        data.appendElement('users', '', users => {
          users.appendElement('element', '', MatchersV3.string(adminUsername))
            .eachLike('element', '', user => {
              user.appendText(MatchersV3.string(testUser))
            })
        })
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.searchUsers('').then(data => {
        expect(typeof (data)).toEqual('object')
        expect(data.indexOf(adminUsername)).toBeGreaterThan(-1)
        expect(data.indexOf(testUser)).toBeGreaterThan(-1)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : searchUsers with zero user results', async function () {
    const provider = createProvider(false, true)
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
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersInteraction(
      provider,
      'check user existence with existing user',
      { search: adminUsername },
      data => {
        data.appendElement('users', '', users => {
          users.appendElement('element', '', MatchersV3.equal(adminUsername))
        })
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userExists(adminUsername).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : userExists with non existent user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersInteraction(
      provider,
      'check user existence with non-existing user',
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

  it('checking method : enableUser with an existing user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)

    await givenUserExists(provider, testUser)
    await provider
      .uponReceiving(`as '${adminUsername}' a PUT request to enable an existing user`)
      .withRequest({
        headers: validAdminAuthHeaders,
        method: 'PUT',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + testUser + '\\/enable',
          '/ocs/v1.php/cloud/users/' + testUser + '/enable'
        )
      }).willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'ok', '100')
            })
          })
      })

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.enableUser(testUser).then((status) => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : disableUser with an existing user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)

    await givenUserExists(provider, testUser)
    await provider
      .uponReceiving(`as '${adminUsername}' a PUT request to disable an existing user`)
      .withRequest({
        headers: validAdminAuthHeaders,
        method: 'PUT',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + testUser + '\\/disable',
          '/ocs/v1.php/cloud/users/' + testUser + '/disable'
        )
      }).willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'ok', '100')
            })
          })
      })

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.disableUser(testUser).then((status) => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : enableUser with a non-existing user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await provider.uponReceiving(`as '${adminUsername}' a PUT request to enable a non-existing user`)
      .withRequest({
        headers: validAdminAuthHeaders,
        method: 'PUT',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '\\/enable',
          '/ocs/v1.php/cloud/users/' + config.nonExistentUser + '/enable'
        )
      }).willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'failure', '101')
            })
          })
      })

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.enableUser(config.nonExistentUser).then((status) => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('101')
      })
    })
  })

  it('checking method : disableUser with a non-existing user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await provider.uponReceiving(`as '${adminUsername}' a PUT request to  disable a non-existing user`)
      .withRequest({
        headers: validAdminAuthHeaders,
        method: 'PUT',
        path: MatchersV3.regex(
          '.*\\/ocs\\/v1\\.php\\/cloud\\/users\\/' + config.nonExistentUser + '\\/disable',
          '/ocs/v1.php/cloud/users/' + config.nonExistentUser + '/disable'
        )
      }).willRespondWith({
        status: 200,
        headers: xmlResponseHeaders,
        body: new XmlBuilder('1.0', '', 'ocs')
          .build(ocs => {
            ocs.appendElement('meta', '', (meta) => {
              return ocsMeta(meta, 'failure', '101')
            })
          })
      })

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.disableUser(config.nonExistentUser).then((status) => {
        expect(status).toBe(null)
      }).catch(error => {
        expect(typeof (error)).toBe('object')
        expect(error.ocs.meta.statuscode).toEqual('101')
      })
    })
  })

  it('checking method : setUserAttribute of an existent user, allowed attribute', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await changeUserAttributeInteraction(
      provider,
      'an existent user, attribute is allowed',
      testUser,
      'key=email&value=asd%40a.com',
      meta => {
        ocsMeta(meta, 'ok', 100, MatchersV3.regex('(OK)?', ''))
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.setUserAttribute(testUser, 'email', 'asd@a.com').then(data => {
        expect(data).toEqual(true)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : setUserAttribute of an existent user, not allowed attribute', async function () {
    const message = 'mail \'Ã¤Ã¶Ã¼Ã¤Ã¤_sfsdf\\+\\$%\\/\\)%&=\' must be a valid email'
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await changeUserAttributeInteraction(
      provider,
      'an existent user, attribute is not allowed',
      testUser,
      'key=email&value=%C3%83%C2%A4%C3%83%C2%B6%C3%83%C2%BC%C3%83%C2%A4%C3%83%C2%A4_sfsdf%2B%24%25%2F)%25%26%3D',
      meta => {
        // [oCIS] Different ocs status-text and status-code in oCIS and oC10
        // https://github.com/owncloud/ocis/issues/1777
        ocsMeta(
          meta,
          'failure',
          '102',
          MatchersV3.regex(`(${message})?`, '')
        )
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.setUserAttribute(testUser, 'email', 'äöüää_sfsdf+$%/)%&=')
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          // FULL REQUEST RESPONSE RETURNED
          expect(typeof (error)).toBe('object')
          expect(error.ocs.meta.statuscode).toEqual('102')
        })
    })
  })

  // trying to edit non-existing user by admin returns unauthorized response
  // https://github.com/owncloud/core/issues/38423
  it('checking method : setUserAttribute of a non existent user', async function () {
    const provider = createProvider(true, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await changeUserAttributeInteraction(
      provider,
      'a non existent user',
      config.nonExistentUser,
      'key=email&value=asd%40a.com',
      meta => {
        // [oCIS] Different ocs status-text and status-code in oCIS and oC10
        // https://github.com/owncloud/ocis/issues/1777
        ocsMeta(
          meta,
          'failure',
          '101',
          MatchersV3.regex('(The requested user could not be found)?', '')
        )
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
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await addUserToGroupInteraction(
      provider,
      'add existent user in a non existent group',
      testUser,
      config.nonExistentGroup
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.addUserToGroup(testUser, config.nonExistentGroup)
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
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await addUserToGroupInteraction(
      provider,
      'add non-existent user in an existent group',
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
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    getGroupOfUserInteraction(
      provider,
      'non-existing user',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(
              meta,
              'failure',
              '998',
              MatchersV3.regex('(The requested user could not be found)?', '')
            )
          })
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
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getGroupOfUserInteraction(
      provider,
      'existent user and group that user isn\'t part of',
      testUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
          }).appendElement('data', '', data => {
            // TODO: adjust the following after the issue is resolved
            // https://github.com/pact-foundation/pact-js/issues/619
            data.appendElement('groups', '', groups => {
              groups.eachLike('element', '', group => {
                group.appendText(MatchersV3.equal(config.testGroup))
              })
            })
          })
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userIsInGroup(testUser, 'admin').then(status => {
        expect(status).toEqual(false)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : userIsInGroup with an existent user, non existent group', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getGroupOfUserInteraction(
      provider,
      'existent user and nonexistant group',
      testUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
          }).appendElement('data', '', data => {
            // TODO: adjust the following after the issue is resolved
            // https://github.com/pact-foundation/pact-js/issues/619
            data.appendElement('groups', '', groups => {
              groups.eachLike('element', '', group => {
                group.appendText(MatchersV3.equal(config.testGroup))
              })
            })
          })
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userIsInGroup(testUser, config.nonExistentGroup)
        .then(status => {
          expect(status).toEqual(false)
        }).catch(error => {
          expect(error).toBe(null)
        })
    })
  })

  it('checking method : userIsInGroup with a non existent user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getGroupOfUserInteraction(
      provider,
      'non-existent user',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            // [oCIS] Different ocs status-text and status-code in oCIS and oC10
            // https://github.com/owncloud/ocis/issues/1777
            return ocsMeta(
              meta,
              'failure',
              '998',
              MatchersV3.regex('(The requested user could not be found)?', '')
            )
          })
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
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUserInformationInteraction(
      provider,
      `get user attribute of an existent user '${testUser}'`,
      testUser,

      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', '100', MatchersV3.regex('(OK)?', ''))
          }).appendElement('data', '', data => {
            data.appendElement('enabled', '', MatchersV3.equal('true'))
              .appendElement('quota', '', quota => {
                quota.appendElement('definition', '', MatchersV3.equal('default'))
              })
              .appendElement('displayname', '', MatchersV3.equal(testUser))
          })
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUser(testUser).then(data => {
        expect(typeof (data)).toEqual('object')
        expect(data.displayname).toEqual(testUser)
      }).catch(error => {
        expect(error).toBe(null)
      })
    })
  })

  it('checking method : getUser with a non existent user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUserInformationOfNonExistentUserInteraction(provider)

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUser(config.nonExistentUser).then(status => {
        expect(status).toBe(true)
      }).catch(error => {
        expect(error.message).toEqual('The requested user could not be found')
      })
    })
  })

  it('checking method : removeUserFromGroup with existent user, non existent group', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await removeUserFromGroupInteraction(
      provider,
      'existent user from a non-existent group',
      testUser,
      config.nonExistentGroup
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.removeUserFromGroup(testUser, config.nonExistentGroup)
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(typeof (error)).toBe('object')
          expect(error.ocs.meta.statuscode).toEqual('102')
        })
    })
  })

  it('checking method : removeUserFromGroup with non existent user, existent group', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await removeUserFromGroupInteraction(
      provider,
      'non-existent user from an existent group',
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

  // [oCIS] subadmin endpoint not implemented
  // https://github.com/owncloud/product/issues/289
  it('checking method : addUserToSubadminGroup with existent user, non existent group', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await addUserToSubAdminGroupInteraction(
      provider,
      'existent user subadmin of non-existent group',
      testUser,
      config.nonExistentGroup,
      meta => {
        ocsMeta(meta, 'failure', 102, 'Group:' + config.nonExistentGroup + ' does not exist')
      }
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.addUserToSubadminGroup(testUser, config.nonExistentGroup)
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('Group:' + config.nonExistentGroup + ' does not exist')
        })
    })
  })

  // [oCIS] subadmin endpoint not implemented
  // https://github.com/owncloud/product/issues/289
  it('checking method : addUserToSubadminGroup with non existent user, existent group', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await addUserToSubAdminGroupInteraction(
      provider,
      'non-existent user subadmin of an existent group',
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
        expect(error.message).toBe('User does not exist')
      })
    })
  })

  // [oCIS] subadmin endpoint not implemented
  // https://github.com/owncloud/product/issues/289
  it('checking method : getUserSubadminGroups with a non existent user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersSubAdminGroupsInteraction(
      provider,
      'non-existent user',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'failure', '998', 'The requested user could not be found')
          })
        })
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.getUserSubadminGroups(config.nonExistentUser).then(data => {
        expect(typeof (data)).toBe('object')
        expect(data.length).toEqual(0)
      }).catch(error => {
        expect(error.message).toBe('The requested user could not be found')
      })
    })
  })

  // [oCIS] subadmin endpoint not implemented
  // https://github.com/owncloud/product/issues/289
  it('checking method : userIsInSubadminGroup with existent user, non existent group', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersSubAdminGroupsInteraction(
      provider,
      'existent user',
      testUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'ok', MatchersV3.equal('100'))
          }).appendElement('data', '', data => {
            data.appendElement('element', '', MatchersV3.equal(config.testGroup))
          })
        })
    )
    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userIsInSubadminGroup(testUser, config.nonExistentGroup)
        .then(status => {
          expect(status).toBe(false)
        }).catch(error => {
          expect(error).toBe(null)
        })
    })
  })

  // [oCIS] subadmin endpoint not implemented
  // https://github.com/owncloud/product/issues/289
  it('checking method : userIsInSubadminGroup with non existent user, existent group', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await getUsersSubAdminGroupsInteraction(
      provider,
      'non-existent user, existing group',
      config.nonExistentUser,
      new XmlBuilder('1.0', '', 'ocs')
        .build(ocs => {
          ocs.appendElement('meta', '', (meta) => {
            return ocsMeta(meta, 'failure', '998', 'The requested user could not be found')
          })
        })
    )

    return provider.executeTest(async () => {
      const oc = createOwncloud()
      await oc.login()
      return oc.users.userIsInSubadminGroup(config.nonExistentUser, config.testGroup)
        .then(status => {
          expect(status).toBe(null)
        }).catch(error => {
          expect(error.message).toBe('The requested user could not be found')
        })
    })
  })

  it('checking method : deleteUser on a non existent user', async function () {
    const provider = createProvider(false, true)
    await getCapabilitiesInteraction(provider)
    await getCurrentUserInformationInteraction(provider)
    await provider
      .uponReceiving(`as '${adminUsername}', a request to delete a non-existent user`)
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
            // [oCIS] Different ocs status-text and status-code in oCIS and oC10
            // https://github.com/owncloud/ocis/issues/1777
            ocsMeta(
              meta,
              'failure',
              101,
              MatchersV3.regex('(The requested user could not be found)?', '')
            )
          })
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
