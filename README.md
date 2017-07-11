[![Build Status](https://travis-ci.org/noveens/js-owncloud-client.svg?branch=master)](https://travis-ci.org/noveens/js-owncloud-client) [![Dependencies Status](https://david-dm.org/noveens/js-owncloud-client.svg)](https://david-dm.org/noveens/js-owncloud-client.svg) [![devDependencies Status](https://david-dm.org/noveens/js-owncloud-client/dev-status.svg)](https://david-dm.org/noveens/js-owncloud-client?type=dev)

<p align="center">
  <img src="https://i.imgur.com/9mKra3O.png" />
</p>

Use this light-weight JS library with a promise based interface for seaemless communication with your ownCloud instance.<br>
Supports both Node.JS and browser JS.


## Install

```
$ npm install js-owncloud-client
```


## Usage

### Node.JS
```js
var owncloud = require('js-owncloud-client');
var oc = new owncloud('*owncloud instance URL*');

// Login
oc.login('username', 'password').then(status => {
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
  oc.shares.shareFileWithLink('linkToYourFile').then(shareInfo => {
      window.alert("Link is : " + shareInfo.getLink());
  }).catch(error => {
      window.alert(error);
  });

  // List all files
  oc.files.list('/path/to/file/folder').then(files => {
      console.log(files);
  }).catch(error => {
      console.log(error);
  });
</script>
```

## All Methods Available

### General
```js
var owncloud = require('js-owncloud-client');
var oc = new owncloud('*owncloud instance URL*');
```
Method          | Code
----------------|------------------------------
setInstance     | `oc.setInstance(instance)`
login           | `oc.login(username, password)`
getConfig       | `oc.getConfig()`
getVersion      | `oc.getVersion()`
getCapabilities | `oc.getCapabilities()`

### Files Management
```js
var owncloud = require('js-owncloud-client');
var oc = new owncloud('*owncloud instance URL*');
```

Method            | Code
------------------|----------------------------------------------------
list              | `oc.files.list(/path/to/file/folder, depth)`
getFileContents   | `oc.files.getFileContents(path/to/file/folder)`
putFileContents   | `oc.files.putFileContents(path/to/file, contents)`
mkdir             | `oc.files.mkdir(path/to/folder)`
createFolder      | `oc.files.createFolder(path/to/folder)`
delete            | `oc.files.delete(path/to/file/folder)`
fileInfo          | `oc.files.fileInfo(path/to/file/folder)`
getFile           | `oc.files.getFile(remotePath, localPath)`
getDirectoryAsZip | `oc.files.getDirectoryAsZip(remotePath, localPath)`
putFile           | `oc.files.putFile(remotePath, localPath)`
putDirectory      | `oc.files.putDirectory(remotePath, localPath)`
move              | `oc.files.move(source, target)`
copy              | `oc.files.copy(source, target)`

### Apps Management
```js
var owncloud = require('js-owncloud-client');
var oc = new owncloud('*owncloud instance URL*');
```
Method          | Code
----------------|----------------------------------------
getApps         | `oc.apps.getApps()`
getAttribute    | `oc.apps.getAttribute(app, key)`
setAttribute    | `oc.apps.setAttribute(app, key, value)`
deleteAttribute | `oc.apps.deleteAttribute(app, key)`
enableApp       | `oc.apps.enableApp(appName)`
disableApp      | `oc.apps.disableApp(appName)`

### Group Management
```js
var owncloud = require('js-owncloud-client');
var oc = new owncloud('*owncloud instance URL*');
```

Method          | Code
----------------|---------------------------------------
createGroup     | `oc.groups.createGroup(groupName)`
deleteGroup     | `oc.groups.deleteGroup(groupName)`
getGroups       | `oc.groups.getGroups()`
getGroupMembers | `oc.groups.getGroupMembers(groupName)`
groupExists     | `oc.groups.groupExists(groupName)`

### Share Management
```js
var owncloud = require('js-owncloud-client');
var oc = new owncloud('*owncloud instance URL*');
```
Method              | Code
--------------------|----------------------------------------------------------------------------------------------------
shareFileWithLink   | `oc.shares.shareFileWithLink(path, {perms: perms, publicUpload: publicUpload, password: password})`
updateShare         | `oc.shares.updateShare(shareId, {perms: perms, publicUpload: publicUpload, password: password})`
shareFileWithUser   | `oc.shares.shareFileWithUser(path, username, {perms: perms, remoteUser: remoteUser })`
shareFileWithGroup  | `oc.shares.shareFileWithGroup(path, groupname, {perms: perms })`
getShares           | `oc.shares.getShares()`
isShared            | `oc.shares.isShared(path/to/file/folder)`
getShare            | `oc.shares.getShare(shareId)`
listOpenRemoteShare | `oc.shares.listOpenRemoteShare()`
acceptRemoteShare   | `oc.shares.acceptRemoteShare(shareId)`
declineRemoteShare  | `oc.shares.declineRemoteShare(shareId)`
deleteShare         | `oc.shares.deleteShare(shareId)`

### User Management
```js
var owncloud = require('js-owncloud-client');
var oc = new owncloud('*owncloud instance URL*');
```
Method                 | Code
-----------------------|------------------------------------------------------
createUser             | `oc.users.createUser(username, password)`
deleteUser             | `oc.users.deleteUser(username)`
searchUsers            | `oc.users.searchUsers(searchKey)`
userExists             | `oc.users.userExists(username)`
getUsers               | `oc.users.getUsers()`
setUserAttribute       | `oc.users.setUserAttribute(username, key, value)`
addUserToGroup         | `oc.users.addUserToGroup(username, groupName)`
getUserGroups          | `oc.users.getUserGroups(username)`
userIsInGroup          | `oc.users.userIsInGroup(username, groupName)`
getUser                | `oc.users.getUser(username)`
removeUserFromGroup    | `oc.users.removeUserFromGroup(username, groupName)`
addUserToSubadminGroup | `oc.users.addUserToSubadminGroup(username, groupName)`
getUserSubadminGroups  | `oc.users.getUserSubadminGroups(username)`
userIsInSubadminGroup  | `oc.users.userIsInSubadminGroup(username, groupName)`

## Building the Documentation

### Swagger Documentation

Stuck? Just type this to see all the above available methods live in action in your browser!<br>

```
$ cd node_modules/js-owncloud-client/
$ make swagger
```
If you open the link showed by running the above command, you will see something like this :
# ![SwaggerDemo](http://imgh.us/swagger_github_upload.jpg)
Here, you can click on any method and type in values, to experiment with the methods in the browser itself!<br>
Now isn't that cool? :wink:

### JSDocs

To build the jsdocs, type this command and follow the instructions on the terminal :

```
$ cd node_modules/js-owncloud-client/
$ make jsdocs
```

## Unit tests

The following command will run all unit tests. Before running the command, make sure you have edited the `owncloud/test/config.json` file accordingly.

```
$ cd node_modules/js-owncloud-client/
$ make test
```


## Team

[![Noveen Sachdeva](http://gravatar.com/avatar/fb09a21ff4cb473d6cf5e70c5fc0f751?s=144)](https://github.com/noveens) &nbsp; &nbsp; &nbsp; &nbsp; [![Vincent Petry](https://avatars1.githubusercontent.com/u/277525?v=3&s=144)](https://github.com/PVince81)
<br>Noveen Sachdeva &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Vincent Petry

# ![GSoC'17](http://cltk.org/assets/GSoC2016Logo.jpg)
