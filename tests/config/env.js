module.exports = {
  isRunningWithOCIS: () => process.env.RUN_ON_OCIS === 'true',
  isRunningOnCI: () => process.env.CI === 'true'
}
