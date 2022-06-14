describe('Unauthorized: Currently testing getConfig, getVersion and getCapabilities', function () {
  const config = require('../config/config.json')
  const { admin: { username: adminUsername } } = require('../config/users.json')

  const {
    getCapabilitiesWithInvalidAuthInteraction,
    createOwncloud,
    createProvider
  } = require('../helpers/pactHelper.js')

  it('checking method : getCapabilities', async function (done) {
    const provider = createProvider(false, true)
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    await provider.executeTest(async () => {
      const oc = createOwncloud(adminUsername, config.invalidPassword)
      await oc.login().then(() => {
        fail('not expected to log in')
      }).catch((err) => {
        expect(err).toBe('Unauthorized')
      })

      return oc.getCapabilities().then(capabilities => {
        expect(capabilities).toBe(null)
        done()
      }).catch(error => {
        expect(error).toMatch('Unauthorized')
        done()
      })
    })
  })
})
