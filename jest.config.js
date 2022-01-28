/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "node_modules/",
    "vendor/",
    "tests/"
  ],
  globalSetup: "<rootDir>/jest.setup.js",
  "setupFiles": [
    "<rootDir>/jest.init.js"
  ],
  testEnvironment: 'node',
  testMatch: [
    '**/tests/*Test.js',
    '**/tests/**/*Test.js'
  ]
};
