[![Build Status](https://travis-ci.org/owncloud/owncloud-sdk.svg?branch=master)](https://travis-ci.org/owncloud/owncloud-sdk)
[![codecov](https://codecov.io/gh/owncloud/owncloud-sdk/branch/master/graph/badge.svg)](https://codecov.io/gh/owncloud/owncloud-sdk)
[![docs](https://img.shields.io/badge/api_docs-online-blue.svg)](https://owncloud.github.io/owncloud-sdk/)

<p align="center">
  <img src="https://i.imgur.com/9mKra3O.png" />
</p>

Use this light-weight JS library with a promise-based interface for seamless communication with your ownCloud instance.<br>
Supports only browser JS but requires JavaScript techniques like webpack to compile it properly.<br>
For Node.js please have a look at [this tag](https://github.com/owncloud/owncloud-sdk/releases/tag/last-nodejs).


## Install

```
$ npm install owncloud-sdk
```


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

[ownCloud web](https://github.com/owncloud/web) will be the next generation web frontend for ownCloud. It uses owncloud-sdk.

## All Methods Available

Full API documentation is available at [![docs](https://img.shields.io/badge/api_docs-online-blue.svg)](https://owncloud.github.io/owncloud-sdk/)

## Building the Documentation

### JSDocs

To build the jsdocs, type this command and follow the instructions on the terminal:

```
$ yarn build:docs
```

## Unit tests

The following command will run all unit tests. Before running the command, make sure you have edited the `owncloud/test/config.json` file accordingly.

```
$ yarn test
```


## Team

<table>
  <tbody>
    <tr>
      <td align="center" valign="top">
        <img width="150" height="150" src="http://gravatar.com/avatar/fb09a21ff4cb473d6cf5e70c5fc0f751?s=144">
        <br>
        <a href="https://github.com/noveens">Noveen Sachdeva</a>
      </td>
      <td align="center" valign="top">
        <img width="150" height="150" src="https://avatars1.githubusercontent.com/u/277525?v=3&s=144">
        <br>
        <a href="https://github.com/PVince81">Vincent Petry</a>
      </td>
      <td align="center" valign="top">
        <img width="150" height="150" src="https://avatars0.githubusercontent.com/u/1005065?s=144&v=4">
        <br>
        <a href="https://github.com/DeepDiver1975">Thomas Müller</a>
      </td>
     </tr>
  </tbody>
</table>


# ![GSoC'17](http://cltk.org/assets/GSoC2016Logo.jpg)
