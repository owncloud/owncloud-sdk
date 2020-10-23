const crypto = require('crypto')
const defaultValues = require('./constants/defaultValues.constant')

exports.createHashedKey = createHashedKey

/**
 * Create a hashed key with secretKey from the string
 * @param {string} stringToHash - The string that will be hashed.
 * @param {string} algorithm - Hashing algorithm.
 * @param {string} secretKey - Secret string.
 * @returns {string} Ready hashed key.
 */
function createHashedKey (stringToHash, algorithm, secretKey, iterations) {
  const hashedKey = crypto.pbkdf2Sync(
    stringToHash,
    secretKey,
    iterations,
    defaultValues.HASH_LENGTH,
    algorithm
  )

  return hashedKey.toString(defaultValues.DIGEST_VALUE)
}
