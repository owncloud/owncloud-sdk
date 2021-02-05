describe('Unauthorized: Currently testing getConfig, getVersion and getCapabilities', function () {
  const config = require('../config/config.json')

  const {
    getCapabilitiesWithInvalidAuthInteraction,
    createOwncloud,
    createProvider
  } = require('../pactHelper.js')

  it('checking method : getCapabilities', async function (done) {
    const provider = createProvider()
    await getCapabilitiesWithInvalidAuthInteraction(provider)

    await provider.executeTest(async () => {
      const oc = createOwncloud(config.username, config.invalidPassword)
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
