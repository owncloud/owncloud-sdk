import '@babel/polyfill'

const {
  createProvider
} = require('./tests/helpers/pactHelper.js')

// create empty pact files for every combination of verified / pending pacts
// so that there is a file for every combination even if there are no interactions for that combination
// that way we don't have to check if a file exists when uploading it to pactflow
// also we make sure that the format of the file is correct, just no interactions added
// when real interactions are added pact will "merge" the empty file with the interactions
module.exports = async () => {
  let provider = createProvider(false, false)
  await provider.executeTest(async () => {
  })
  provider = createProvider(true, true)
  await provider.executeTest(async () => {
  })
  provider = createProvider(true, false)
  await provider.executeTest(async () => {
  })
  provider = createProvider(false, true)
  await provider.executeTest(async () => {
  })
}
