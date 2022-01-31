[![Build Status](https://travis-ci.org/owncloud/owncloud-sdk.svg?branch=master)](https://travis-ci.org/owncloud/owncloud-sdk)
[![codecov](https://codecov.io/gh/owncloud/owncloud-sdk/branch/master/graph/badge.svg)](https://codecov.io/gh/owncloud/owncloud-sdk)
[![docs](https://img.shields.io/badge/api_docs-online-blue.svg)](https://owncloud.github.io/owncloud-sdk/)

# ownCloud JavaScript SDK

Use this light-weight JS library with a promise-based interface for seamless communication with your ownCloud instance, both from the browser and from Node backends.

## Installation

Run either 

```
npm install owncloud-sdk
```

or

```
yarn add owncloud-sdk
```

to add the `owncloud-sdk` to your project.

## Usage

```js
const owncloud = require('owncloud-sdk');
let oc = new owncloud({
      baseUrl: config.owncloudURL,
      auth: {
        basic: {
          username: config.username,
          password: config.password
        }
      }
});

// Login
oc.login().then(status => {
    // STUFF
}).catch(error => {
    // HANDLE ERROR
});

// Share File With Link
oc.shares.shareFileWithLink('linkToYourFile').then(shareInfo => {
    console.log("Link is : " + shareInfo.getLink());
}).catch(error => {
    // HANDLE ERROR
});

// List all files
oc.files.list('/path/to/file/folder').then(files => {
    console.log(files);
}).catch(error => {
    console.log(error);
});
```

## Example Projects

### ownCloud web

[ownCloud web](https://github.com/owncloud/web) is the next generation web frontend for ownCloud.

### ownCloud file-picker

[ownCloud file-picker](github.com/owncloud/file-picker) is an integration to access the files in your ownCloud, e.g. in a chat app.

## Documentation

The full API documentation is available [on the docs website](https://owncloud.dev/owncloud-sdk/).

### Building the docs

The docs are based on JSDocs.
To build them, run the following command and follow the instructions on the terminal:

```
yarn build:docs
```

## Unit/Integration tests

### Overview

`owncloud-sdk` uses [pactjs](https://github.com/pact-foundation/pact-js) with jest for unit and integration tests.

On the pact provider side, tests have 4 different `interactions`:

- interactions that work on both oc10 & ocis
- interactions that are "pending" on oc10 but should work on ocis
- interactions that are "pending" on ocis but should work on oc10
- interactions that are "pending" on both ocis & oc10

The CI is not expected to fail for the interactions that are "pending" but it's expected to fail for those interactions that were already verified and started failing. Pact.io has a system to handle such a scenario called [pending pacts](https://docs.pact.io/pact_broker/advanced_topics/pending_pacts/ 'pending pacts'). This feature allows changed contracts to be verified without failing the provider's build.

Four different pacts for the different buckets of interactions are created when running the provider tests. Pacts that are allowed to fail are marked as `pending` else not.

In a consumer test, a new mock provider is created using the function `createProvider`. It takes two parameters: `pendingOnOc10` and `pendingOnOcis` in order. Each parameter can have value `true` or `false` depending upon which provider-version the test is still pending.

To add a new consumer test which is expected to fail on ocis but pass on oc10 provider, provider should be created as:

```js
describe('feature', function () {
  it('new test feature', function () {
    const isPendingOnOc10 = true // set this as true if the test is allowed to fail on oc10 provider
    const isPendingOnOcis = false // set this as true if the test is allowed to fail on ocis provider
    const provider = createProvider(isPendingOnOc10, isPendingOnOcis)
    // get interactions
    // execute test
    provider.executeTest(() => {
      // test body
    })
  })
})
```
### Running tests

At first, you need to create `config.json` file.

```
cp tests/config/config.sample.json tests/config/config.json
```

### Consumer tests

The pact consumer tests checks owncloud sdk against the pact mock server. In order to run these tests, use the following command:

```
yarn test-consumer
```

> Note: If you have pacts from old test run in `tests/pacts` your tests will fail. Make sure to delete that before you run the tests again.

### Provider tests

The pact provider tests the pacts generated from the consumer tests against the real owncloud backend server. For this you will need an actual owncloud server running. Then you can run the pact tests with the following command:
```
PROVIDER_BASE_URL=<owncloud-backend-url> yarn test-provider
```

## Credits

This project was originally created by <a href="https://github.com/noveens">Noveen Sachdeva</a>, <a href="https://github.com/PVince81">Vincent Petry</a> and <a href="https://github.com/DeepDiver1975">Thomas Müller</a> as part of the [2017 Google Summer of Code](https://summerofcode.withgoogle.com/archive/2017/projects/5166409181036544).

## License

The ownCloud SDK is released under the [MIT License](https://github.com/owncloud/owncloud-sdk/blob/master/LICENSE.md).
