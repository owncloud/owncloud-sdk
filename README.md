[![Build Status](https://travis-ci.org/owncloud/js-owncloud-client.svg?branch=master)](https://travis-ci.org/noveens/js-owncloud-client)
[![codecov](https://codecov.io/gh/owncloud/js-owncloud-client/branch/master/graph/badge.svg)](https://codecov.io/gh/owncloud/js-owncloud-client)


<p align="center">
  <img src="https://i.imgur.com/9mKra3O.png" />
</p>

Use this light-weight JS library with a promise based interface for seamless communication with your ownCloud instance.<br>
Supports only browser JS but requires Javascript techniques like webpack to compile it properly
For Nods.js please have a look at [this tag](https://github.com/owncloud/js-owncloud-client/releases/tag/last-nodejs)


## Install

```
$ npm install js-owncloud-client
```


## Usage

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

## Example Projects

### ownCloud Phoenix



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

### JSDocs

To build the jsdocs, type this command and follow the instructions on the terminal :

```
$ cd node_modules/js-owncloud-client/
$ yarn run docs
```

## Unit tests

The following command will run all unit tests. Before running the command, make sure you have edited the `owncloud/test/config.json` file accordingly.

```
$ cd node_modules/js-owncloud-client/
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
        <a href="https://github.com/PVince82">Vincent Petry</a>
      </td>
      <td align="center" width="20%" valign="top">
        <img width="150" height="150" src="https://avatars0.githubusercontent.com/u/1005065?s=144&v=4">
        <br>
        <a href="https://github.com/DeepDiver1975">Thomas Müller</a>
      </td>
     </tr>
  </tbody>
</table>


# ![GSoC'17](http://cltk.org/assets/GSoC2016Logo.jpg)
