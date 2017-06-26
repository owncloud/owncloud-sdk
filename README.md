[![Build Status](https://travis-ci.org/noveens/js-owncloud-client.svg?branch=master)](https://travis-ci.org/noveens/js-owncloud-client) [![Dependencies Status](https://david-dm.org/noveens/js-owncloud-client.svg)](https://david-dm.org/noveens/js-owncloud-client.svg) [![devDependencies Status](https://david-dm.org/noveens/js-owncloud-client/dev-status.svg)](https://david-dm.org/noveens/js-owncloud-client?type=dev)

# ![ownCloud](https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/OwnCloud_logo_and_wordmark.svg/1200px-OwnCloud_logo_and_wordmark.svg.png)

Use this JS library for seaemless communication with your ownCloud instance.<br>
Supports both Node.JS and browser JS.


## Install

```
$ git clone https://github.com/noveens/js-owncloud-client.git
$ make
```


## Usage

### Node.JS
```js
var owncloud = require('js-owncloud-client/owncloud');
var oc = new owncloud('*owncloud instance URL*');

// Login
oc.login('username', 'password').then(status => {
    // STUFF
}).catch(error => {
    // HANDLE ERROR
});

// Share File With Link
oc.shareFileWithLink('linkToYourFile').then(shareInfo => {
    console.log("Link is : " + shareInfo.getLink());
}).catch(error => {
    // HANDLE ERROR
});
```

### Browser
```html
<script type="text/javascript" src="./js-owncloud-client/browser/bundle.js"></script>

<script type="text/javascript">
  // var oc is global
  oc.setInstance('*owncloud instance URL*');

  // Login
  oc.login('username', 'password').then(status => {
    window.alert(status);
  }).catch(error => {
    window.alert(error);
  });
  
  // Share File With Link
  oc.shareFileWithLink('linkToYourFile').then(shareInfo => {
      window.alert("Link is : " + shareInfo.getLink());
  }).catch(error => {
      window.alert(error);
  });
</script>
```

## Building the Documentation

### Swagger Documentation

Want to see a cool live demo of the library in action? Just type this and see for yourself :

```
$ make swagger
```
If you open the link showed by running the above command, you will see something like this :
# ![SwaggerDemo](http://imgh.us/swagger_github_upload.jpg)
Here, you can click on any method and type in values, to experiment with the methods in the browser itself!<br>
Now isn't that cool? :wink:

### JSDocs

To build the jsdocs, type this command and follow the instructions on the terminal :

```
$ make jsdocs
```


## Unit tests

The following command will run all unit tests. Before running the command, make sure you have edited the `owncloud/test/config.json` file accordingly.

```
$ make test
```


## Team

[![Noveen Sachdeva](http://gravatar.com/avatar/fb09a21ff4cb473d6cf5e70c5fc0f751?s=144)](https://github.com/noveens) &nbsp; &nbsp; &nbsp; &nbsp; [![Vincent Petry](https://avatars1.githubusercontent.com/u/277525?v=3&s=144)](https://github.com/PVince81)
<br>Noveen Sachdeva &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Vincent Petry

# ![GSoC'17](http://cltk.org/assets/GSoC2016Logo.jpg)
