# ![pageres](https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/OwnCloud_logo_and_wordmark.svg/1200px-OwnCloud_logo_and_wordmark.svg.png)

[![Build Status](https://travis-ci.org/noveens/js-owncloud-client.svg?branch=master)](https://travis-ci.org/noveens/js-owncloud-client) [![Coverage Status](https://coveralls.io/repos/github/noveens/js-owncloud-client/badge.svg?branch=master)](https://coveralls.io/github/noveens/js-owncloud-client?branch=master) [![Twitter](https://img.shields.io/twitter/url/https/www.github.com/noveens/js-owncloud-client.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=%5Bobject%20Object%5D)

Use this JS library for seaemless communication with your ownCloud instance.
Currently supports NodeJS, browser support coming soon!


## Install

```
$ git clone https://github.com/noveens/js-owncloud-client.git
$ sudo npm i
```


## Usage

```js
var owncloud = require('js-owncloud-client/owncloud');
var oc = new owncloud('*owncloud instance URL*')

// Login
oc.login('username', 'password', function(error, status) {
  // STUFF
});

// Share File With Link
oc.shareFileWithLink('linkToYourFile', function(error, shareInfo) {
  console.log("Link is : " + shareInfo.getLink());
});

```

## Team

[![Noveen Sachdeva](http://gravatar.com/avatar/fb09a21ff4cb473d6cf5e70c5fc0f751?s=144)](http://noveensachdeva.me) &nbsp; &nbsp; &nbsp; &nbsp; [![Vincent Petry](https://avatars1.githubusercontent.com/u/277525?v=3&s=144)](https://github.com/PVince81)
<br>Noveen Sachdeva &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Vincent Petry
