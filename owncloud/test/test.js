var config = require('./config.js');
var ownCloud = require("../index.js");
var utf8 = require('utf8');

// CURRENT TIME
var timeRightNow = new Date().getTime();

// LIBRARY INSTANCE
var oc;

// TESTING CONFIGS
var testUserPassword = 'password';
var testContent 	 = 'testContent';
var testUser    	 = 'testUser' + timeRightNow;
var testGroup   	 = 'testGroup' + timeRightNow;
var testFolder  	 = 'testFolder' + timeRightNow;
var testApp     	 = 'someAppName' + timeRightNow;
var nonExistingApp   = 'nonExistingApp' + timeRightNow;
var nonExistingFile  = 'nonExistingFile' + timeRightNow;
var nonExistingUser  = 'nonExistingUser' + timeRightNow;
var nonExistingGroup = 'nonExistingGroup' + timeRightNow;
var testFiles   	 = [
						'/test.txt' + timeRightNow,
						'/test space and + and #.txt' + timeRightNow,
						'/文件.txt' + timeRightNow
					   ];

// CREATED SHARES
var sharedFilesWithUser = {};
var sharedFilesByLink = {};
var testFolderShareID = null;
var allShareIDs = [];

// CONSTANTS FROM lib/public/constants.php
var OCS_PERMISSION_READ = 1;
var OCS_PERMISSION_UPDATE = 2;
var OCS_PERMISSION_CREATE = 4;
var OCS_PERMISSION_SHARE = 16;

describe("Currently creating all requirements for running tests,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password);
	});

	it('creating test user', function (done) {
		oc.users.createUser(testUser, testUserPassword).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('creating test group', function (done) {
		oc.groups.createGroup(testGroup).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('creating test files', function (done) {
		for (var i=0;i<testFiles.length;i++) {
			oc.files.putFileContents(testFiles[i], testContent).then(status => {
				expect(status).toBe(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('creating test folder', function (done) {
		oc.files.createFolder(testFolder).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});
});

describe("Currently testing Login and initLibrary,", function() {
	beforeEach(function () {
		oc = null;
	});

	it('checking method : initLibrary to be null', function () {
		expect(oc).toBe(null);
	});

	it('checking method : initLibrary', function () {
		oc = new ownCloud('someRandomName');

		expect(oc).not.toBe(null);
	});

	it('checking method : login with a non existent instance URL', function(done) {
		oc = new ownCloud('someRandomName');

		oc.login(config.username, config.password).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe("Please provide a valid owncloud instance");
			done();
		});
	});

	it('checking method : login with wrong username and password', function(done) {
		oc = new ownCloud(config.owncloudURL);

		oc.login(nonExistingUser, 'password' + timeRightNow).then(status => {
			expect(status).tobe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Current user is not logged in');
			done();
		});
	});

	it('checking method : login with correct username only', function(done) {
		oc = new ownCloud(config.owncloudURL);

		oc.login(config.username, 'password' + timeRightNow).then(status => {
			expect(status).tobe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Current user is not logged in');
			done();
		});
	});

	it('checking method : login with correct username and password', function(done) {
		oc = new ownCloud(config.owncloudURL);

		oc.login(config.username, config.password).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});
});

describe("Currently testing getConfig, getVersion and getCapabilities", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password);
	});

	it('checking method : getConfig', function (done) {
		oc.getConfig().then(config => {
			expect(config).not.toBe(null);
			expect(typeof(config)).toBe('object');
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getVersion', function (done) {
		oc.getVersion().then(version => {
			expect(version).not.toBe(null);
			expect(typeof(version)).toEqual('string');
			expect(version.split('.').length).toBeGreaterThan(2);
			done();
		}).catch(error => {
			expect(error).tobe(null);
			done();
		});
	});

	it('checking method : getCapabilities', function (done) {
		oc.getCapabilities().then(capabilities => {
			expect(capabilities).not.toBe(null);
			expect(typeof(capabilities)).toBe('object');
			
			// Files App is never disabled
			expect(capabilities.files).not.toBe(null);
			expect(capabilities.files).not.toBe(undefined);
			
			// Big file chunking of files app is always on
			expect(parseInt(capabilities.files.bigfilechunking)).toEqual(1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});
});

describe("Currently testing apps management,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password);
	});

	it('checking method : getApps', function (done) {
		oc.apps.getApps().then(apps => {
			expect(apps).not.toBe(null);
			expect(typeof(apps)).toBe('object');
			expect(apps.files).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : setAttribute', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];
		var value = ['value1', 'value+plus space and/slash', '值对1'];

		for (var i=0;i<key.length;i++) {
			oc.apps.setAttribute(testApp, key[i], value[i]).then(status => {
				expect(status).toBe(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : valid getAttribute', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];
		var value = ['value1', 'value+plus space and/slash', '值对1'];

		for (var i=0;i<key.length;i++) {
			oc.apps.getAttribute(testApp, key[i]).then(data => {
				expect(value.indexOf(utf8.decode(data))).toBeGreaterThan(-1);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : non existent getAttribute', function (done) {
		var key = ['attr2', 'attr+plus space ', '属性12'];
		
		for (var i=0;i<key.length;i++) {
			oc.apps.getAttribute(testApp, key[i]).then(data => {
				expect(data).toEqual(null);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : getAttribute without key', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];
		var value = ['value1', 'value+plus space and/slash', '值对1'];
		
		oc.apps.getAttribute(testApp).then(allAttributes => {
			for (var i=0;i<key.length;i++) {
				expect(typeof(allAttributes)).toBe('object');
				expect(utf8.encode(key[i]) in allAttributes).toBe(true);
				var ocValue = utf8.decode(allAttributes[utf8.encode(key[i])]);
				expect(value.indexOf(ocValue)).toBeGreaterThan(-1);
				done();
			}
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : setAttribute with empty value', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];

		for (var i=0;i<key.length;i++) {
			oc.apps.setAttribute(testApp, key[i], '').then(status => {
				expect(status).toBe(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : getAttribute with empty value', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];

		for (var i=0;i<key.length;i++) {
			oc.apps.getAttribute(testApp, key[i]).then(value => {
				expect(value).toEqual('');
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : deleteAttribute', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];

		for (var i=0;i<key.length;i++) {
			oc.apps.deleteAttribute(testApp, key[i]).then(status => {
				expect(status).toBe(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : enableApp when app exists', function (done) {
		oc.apps.enableApp('files').then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : disableApp when app exists', function (done) {
		oc.apps.disableApp('files').then(status => {
			expect(status).toBe(true);

			// Re-Enabling the Files App
			return oc.apps.enableApp('files');
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : enableApp when app doesn\'t exist', function (done) {
		oc.apps.enableApp(nonExistingApp).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toEqual('No app found by the name "' + nonExistingApp + '"');
			done();
		});
	});

	it('checking method : disableApp when app doesn\'t exist', function (done) {
		oc.apps.disableApp(nonExistingApp).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});
});

describe("Currently testing file/folder sharing,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password);
	});

	it('checking method : shareFileWithLink with existent file', function (done) {
		for (var i=0;i<testFiles.length;i++) {
			oc.shares.shareFileWithLink(testFiles[i]).then(share => {
				expect(share).not.toBe(null);
				expect(typeof(share)).toBe('object');
				expect(testFiles.indexOf(utf8.decode(share.getPath()))).toBeGreaterThan(-1);
				expect(typeof(share.getId())).toBe('number');
				expect(typeof(share.getLink())).toBe('string');
				expect(typeof(share.getToken())).toBe('string');
				sharedFilesByLink[share.getPath()] = share.getId();
				allShareIDs.push(share.getId());
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : shareFileWithLink with non-existent file', function (done) {
		oc.shares.shareFileWithLink(nonExistingFile, {password : 'testPassword'}).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	it('checking method : shareFileWithUser with existent File', function (done) {
		for (var i=0;i<testFiles.length;i++) {
			oc.shares.shareFileWithUser(testFiles[i], testUser).then(share => {
				expect(share).not.toBe(null);
				expect(typeof(share)).toBe('object');
				expect(typeof(share.getId())).toBe('number');
				sharedFilesWithUser[share.getPath()] = share.getId();
				allShareIDs.push(share.getId());

				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : shareFileWithUser for the user file is shared with', function (done) {
		oc.login(testUser, testUserPassword).then(status => {
			expect(status).toBe(true);
			for (var key in sharedFilesWithUser) {
				return oc.shares.getShare(sharedFilesWithUser[key]);
			}
		}).then(share => {
			expect(share).not.toBe(null);
			expect(typeof(share)).toBe('object');
			expect(typeof(share.getId())).toBe('number');
			expect(share.getShareWith()).toEqual(testUser);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : shareFileWithGroup with existent file', function (done) {
		for (var i=0;i<testFiles.length;i++) {
			oc.shares.shareFileWithGroup(testFiles[i], testGroup, {perms: 19}).then(share => {
				expect(typeof(share)).toEqual('object');
				expect(share.getPermissions()).toEqual(19);
				allShareIDs.push(share.getId());
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : shareFileWithGroup with non existent file', function (done) {
		oc.shares.shareFileWithGroup(nonExistingFile, testGroup, {perms: 19}).then(share => {
			expect(share).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	it('checking method : isShared with non existent file', function (done) {
		oc.shares.isShared(nonExistingFile).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	it('checking method : isShared with shared file', function (done) {
		for (var key in sharedFilesWithUser) {
			oc.shares.isShared(key).then(status => {
				expect(status).toEqual(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : isShared with existent but non shared file', function (done) {
		oc.files.putFileContents('newFileCreated' + timeRightNow).then(status => {
			expect(status).toBe(true);
			return oc.shares.isShared('newFileCreated' + timeRightNow);
		}).then(isShared => {
			expect(isShared).toEqual(false);
			// DELETING THE NEWLY CREATED FILE
			return oc.files.delete('newFileCreated' + timeRightNow);
		}).then(status2 => {
			expect(status2).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getShare with existent share', function (done) {
		for (var key in sharedFilesByLink) {
			oc.shares.getShare(sharedFilesWithUser[key]).then(share => {
				expect(typeof(share)).toBe('object');
				expect(sharedFilesWithUser.hasOwnProperty(share.getId())).toBeGreaterThan(-1);
				done();				
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : getShare with non existent share', function (done) {
		oc.shares.getShare(-1).then(share => {
			expect(share).toBe(null);
			done();
		}).catch(error => {
			expect(error).toEqual('Wrong share ID, share doesn\'t exist');
			done();
		});
	});

	it('checking method : getShares for shared file', function (done) {
		for (var key in sharedFilesWithUser) {
			oc.shares.getShares(key).then(shares => {
				expect(shares.constructor).toBe(Array);
				var flag = 0;
				for (var i=0;i<shares.length;i++) {
					var share = shares[i];
					if (sharedFilesWithUser.hasOwnProperty(share.getId()) > -1) {
						flag = 1;
					}
				}
				expect(flag).toEqual(1);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : getShares for non existent file', function (done) {
		oc.shares.getShares(nonExistingFile).then(shares => {
			expect(shares).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	it('checking method : getShares for existent but non shared file', function (done) {
		oc.files.putFileContents('newFileCreated' + timeRightNow).then(status => {
			expect(status).toBe(true);
			return oc.shares.getShares('newFileCreated' + timeRightNow);
		}).then(shares => {
			expect(shares.constructor).toEqual(Array);
			expect(shares.length).toEqual(0);
			// DELETING THE NEWLY CREATED FILE
			return oc.files.delete('newFileCreated' + timeRightNow);
		}).then(status2 => {
			expect(status2).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share, editing permissions', function (done) {
		oc.shares.shareFileWithLink(testFolder).then(share => {
			expect(typeof(share)).toBe('object');
			testFolderShareID = share.getId();
			allShareIDs.push(testFolderShareID);
			return oc.shares.updateShare(testFolderShareID, {perms: 31}); // max-permissions
		}).then(share => {
			expect(share).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Can\'t change permissions for public share links');
			done();
		});	
	});

	it('checking method : updateShare for existent share, confirming changed permissions', function (done) {
		oc.shares.getShare(testFolderShareID).then(share => {
			// permissions would still be read only as the share is public
			expect(share.getPermissions()).toEqual(1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share, making publicUpload true', function (done) {
		oc.shares.updateShare(testFolderShareID, {publicUpload: true}).then(data => {
			expect(data).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share, confirming publicUpload', function (done) {
		oc.shares.getShare(testFolderShareID).then(share => {
			expect(share.getPermissions() & OCS_PERMISSION_CREATE).toBeGreaterThan(0);
			expect(share.getPermissions() & OCS_PERMISSION_UPDATE).toBeGreaterThan(0);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share, adding password', function (done) {
		oc.shares.updateShare(testFolderShareID, {password: 'testPassword'}).then(status => {
			expect(status).toEqual(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share, confirming password', function (done) {
		oc.shares.getShare(testFolderShareID).then(share => {
			expect(typeof(share.getShareWith())).toEqual('string');
			expect(typeof(share.getShareWithDisplayName())).toEqual('string');
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share with user, editing permissions', function (done) {
		var maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE;

		for (var key in sharedFilesWithUser) {
			oc.shares.updateShare(sharedFilesWithUser[key], {perms: maxPerms}).then(status => {
				expect(status).toEqual(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : updateShare for existent share with user, confirming permissions', function (done) {
		var maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE;

		for (var key in sharedFilesWithUser) {
			oc.shares.getShare(sharedFilesWithUser[key]).then(share => {
				expect(share.getPermissions()).toEqual(maxPerms);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : updateShare for non existent share', function (done) {
		oc.shares.updateShare(-1).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong share ID, share doesn\'t exist');
			done();
		});
	});

	it('checking method : deleteShare with existent share', function (done) {
		for (var key in sharedFilesWithUser) {
			oc.shares.getShare(sharedFilesWithUser[key]).then(share => {
				expect(typeof(share)).toBe("object");
				this.id = share.getId();
				var shareIDtoRemove = allShareIDs.indexOf(this.id);
				if (shareIDtoRemove > -1)  {
					allShareIDs.splice(shareIDtoRemove, 1);
				}
				return oc.shares.deleteShare(share.getId());
			}).then(status => {
				expect(status).toBe(true);
				return oc.shares.getShare(this.id);
			}).then(share => {
				expect(share).toBe(null);
				done();
			}).catch(error => {
				expect(error).toEqual('Wrong share ID, share doesn\'t exist');
				done();
			});
		}
	});

	it('checking method : deleteShare with non existent share', function (done) {
		oc.shares.deleteShare(-1).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong share ID, share doesn\'t exist');
			done();
		});
	});
});

describe("Currently testing user management,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password);
	});

	it('checking method : getUser on an existent user', function (done) {
		oc.users.getUser(config.username).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.displayname).toEqual(config.username);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getUser on a non existent user', function (done) {
		oc.users.getUser(nonExistingUser).then(user => {
			expect(user).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('The requested user could not be found');
			done();
		});
	});

	it('checking method : createUser', function (done) {
		oc.users.createUser('newUser' + timeRightNow).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.displayname).toEqual('newUser' + timeRightNow);
			return oc.users.deleteUser('newUser' + timeRightNow);
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : searchUsers', function (done) {
		oc.users.searchUsers('').then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.indexOf(config.username)).toBeGreaterThan(-1);
			expect(data.indexOf(testUser)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : searchUsers with zero user results', function (done) {
		oc.users.searchUsers(nonExistingUser).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.length).toEqual(0);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userExists with existent user', function (done) {
		oc.users.userExists(config.username).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userExists with non existent user', function (done) {
		oc.users.userExists(nonExistingUser).then(status => {
			expect(status).toBe(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : setUserAttribute of an existent user, allowed attribute', function (done) {
		oc.users.setUserAttribute(testUser, 'email', 'asd@a.com').then(data => {
			expect(data).toEqual(true);
			return oc.users.getUser(testUser);
		}).then(user => {
			expect(typeof(user)).toEqual('object');
			expect(user.email).toEqual('asd@a.com');
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : setUserAttribute of an existent user, not allowed attribute', function (done) {
		oc.users.setUserAttribute(testUser, 'email', 'äöüää_sfsdf+$%/)%&=')
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			// FULL REQUEST RESPONSE RETURNED
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('102');
			done();
		});
	});

	it('checking method : setUserAttribute of a non existent user', function (done) {
		oc.users.setUserAttribute(nonExistingUser, 'email', 'asd@a.com').then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('997');
			done();
		});
	});

	it('checking method : addUserToGroup with existent user, existent group', function (done) {
		oc.users.addUserToGroup(testUser, testGroup).then(status => {
			expect(status).toBe(true);
			return oc.users.userIsInGroup(testUser, testGroup);
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : addUserToGroup with existent user, non existent group', function (done) {
		oc.users.addUserToGroup(testUser, nonExistingGroup)
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			// FULL RESPONSE IS RETURNED
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('102');
			done();
		});
	});

	it('checking method : addUserToGroup with non existent user, existent group', function (done) {
		oc.users.addUserToGroup(nonExistingUser, testGroup).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('103');
			done();
		});
	});

	it('checking method : getUserGroups with an existent user', function (done) {
		oc.users.getUserGroups(testUser).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.indexOf(testGroup)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getUserGroups with a non existent user', function (done) {
		oc.users.getUserGroups(nonExistingUser).then(data => {
			expect(typeof(data)).toBe('object');
			expect(data.length).toEqual(0);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('998');
			done();
		});
	});

	it('checking method : userIsInGroup with an existent user, existent group', function (done) {
		oc.users.userIsInGroup(testUser, testGroup).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInGroup with an existent user but a group the user isn\'t part of', function (done) {
		oc.users.userIsInGroup(testUser, 'admin').then(status => {
			expect(status).toEqual(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInGroup with an existent user, non existent group', function (done) {
		oc.users.userIsInGroup(testUser, nonExistingGroup)
		.then(status => {
			expect(status).toEqual(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInGroup with a non existent user', function (done) {
		oc.users.userIsInGroup(nonExistingUser, testGroup).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('998');
			done();
		});
	});

	it('checking method : getUser with an existent user', function (done) {
		oc.users.getUser(testUser).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.displayname).toEqual(testUser);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getUser with a non existent user', function (done) {
		oc.users.getUser(nonExistingUser).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toEqual('The requested user could not be found');
			done();
		});
	});

	it('checking method : removeUserFromGroup with existent user, existent group', function (done) {
		oc.users.removeUserFromGroup(testUser, testGroup).then(status => {
			expect(status).toBe(true);
			return oc.users.userIsInGroup(testUser, testGroup);
		}).then(status => {
			expect(status).toBe(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : removeUserFromGroup with existent user, non existent group', function (done) {
		oc.users.removeUserFromGroup(testUser, nonExistingGroup)
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('102');
			done();
		});
	});

	it('checking method : removeUserFromGroup with non existent user, existent group', function (done) {
		oc.users.removeUserFromGroup(nonExistingGroup, testGroup)
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('103');
			done();
		});
	});

	it('checking method : addUserToSubadminGroup with existent user, existent group', function (done) {
		oc.users.addUserToSubadminGroup(testUser, testGroup).then(status => {
			expect(status).toBe(true);
			return oc.users.userIsInSubadminGroup(testUser, testGroup);			
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : addUserToSubadminGroup with existent user, non existent group', function (done) {
		oc.users.addUserToSubadminGroup(testUser, nonExistingGroup)
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Group:' + nonExistingGroup + ' does not exist');
			done();
		});
	});

	it('checking method : addUserToSubadminGroup with non existent user, existent group', function (done) {
		oc.users.addUserToSubadminGroup(nonExistingUser, testGroup).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('User does not exist');
			done();
		});
	});

	it('checking method : getUserSubadminGroups with an existent user', function (done) {
		oc.users.getUserSubadminGroups(testUser).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.indexOf(testGroup)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getUserSubadminGroups with a non existent user', function (done) {
		oc.users.getUserSubadminGroups(nonExistingUser).then(data => {
			expect(typeof(data)).toBe('object');
			expect(data.length).toEqual(0);
			done();
		}).catch(error => {
			expect(error).toBe('User does not exist');
			done();
		});
	});

	it('checking method : userIsInSubadminGroup with existent user, existent group', function (done) {
		oc.users.userIsInSubadminGroup(testUser, testGroup).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInSubadminGroup with existent user, non existent group', function (done) {
		oc.users.userIsInSubadminGroup(testUser, nonExistingGroup)
		.then(status => {
			expect(status).toBe(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInSubadminGroup with non existent user, existent group', function (done) {
		oc.users.userIsInSubadminGroup(nonExistingUser, testGroup)
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('User does not exist');
			done();
		});
	});

	it('checking method : deleteUser on a non existent user', function (done) {
		oc.users.deleteUser(nonExistingUser).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('101');
			done();
		});
	});

	it('checking method : deleteUser on an existent user', function (done) {
		oc.users.deleteUser(testUser).then(status => {
			expect(status).toBe(true);
			return oc.users.getUser(testUser);
		}).then(user => {
			expect(user).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('The requested user could not be found');
			done();
		});
	});
});

describe("Currently testing group management,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password);
	});

	it('checking method : createGroup', function (done) {
		oc.groups.createGroup('newGroup' + timeRightNow).then(status => {
			expect(status).toBe(true);
			return oc.groups.groupExists('newGroup' + timeRightNow);
		}).then(status => {
			expect(status).toBe(true);
			return oc.groups.deleteGroup('newGroup' + timeRightNow);
		}).then(status2 => {
			expect(status2).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getGroups', function (done) {
		oc.groups.getGroups().then(data => {
			expect(typeof(data)).toBe('object');
			expect(data.indexOf('admin')).toBeGreaterThan(-1);
			expect(data.indexOf(testGroup)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : groupExists with an existing group', function (done) {
		oc.groups.groupExists('admin').then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : groupExists with a non existing group', function (done) {
		oc.groups.groupExists(nonExistingGroup).then(status => {
			expect(status).toBe(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getGroupMembers', function (done) {
		oc.groups.getGroupMembers('admin').then(data => {
			expect(typeof(data)).toBe('object');
			expect(data.indexOf(config.username)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : deleteGroup with an existing group', function (done) {
		oc.groups.deleteGroup(testGroup).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : deleteGroup with a non existing group', function (done) {
		oc.groups.deleteGroup(nonExistingGroup).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('101');
			done();
		});
	});
});

describe("checking if all created elements have been deleted,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password);
	});

	it('checking created user', function (done) {
		oc.users.userExists(testUser).then(status => {
			if (status === true)  {
				oc.users.deleteUser(testUser).then(status2 => {
					expect(status2).toBe(true);
					done();
				}).catch(error2 => {
					expect(error2).toBe(null);
					done();
				});
			}
			else {
				done();
			}
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking created files', function (done) {
		for (var i=0;i<testFiles.length;i++) {
			oc.files.delete(testFiles[i]).then(status => {
				expect(status).toBe(true);
				done();
			});
		}
	});

	it('checking created folder', function (done) {
		oc.files.delete(testFolder).then(status => {
			expect(status).toBe(true);
			done();
		});
	});

	it('checking created group', function (done) {
		oc.groups.groupExists(testGroup).then(status => {
			if (status === true) {
				oc.groups.deleteGroup(testGroup).then(status2 => {
					expect(status2).toBe(true);
					done();
				}).catch(error2 => {
					expect(error2).toBe(null);
					done();
				});
			}
			else {
				done();
			}
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking created shares', function (done) {
		for (var i=0;i<allShareIDs.length;i++) {
			oc.shares.deleteShare(allShareIDs[i]).then(status2 => {
				expect(status2).toBe(true);
				done();
			});
		}
	});
});