var config = require('./config.js');
var ownCloud = require("../index.js");
var utf8 = require('utf8');
var oc;
var share2user = null;
var testGroup = null;
var shareIDs = {};
var sharedFilesByLink = {};
var testFolder = config.testFolder || 'testFolder' + new Date().getTime();
var testFolderShareID = null;
var timeRightNow = new Date().getTime();

describe("Currently testing Login and initLibrary,", function() {
	// UNCOMMENT INSIDE AFTER COMPLETING createFolder
	beforeAll(function (done) {
		oc = new ownCloud(config.owncloudURL);
		/* jshint unused: false */
		oc.login(config.username, config.password).then(status => {
			return oc.createUser(config.owncloudShare2user, "sharePassword");
		}).then(status => {
			share2user = config.owncloudShare2user;
			return oc.createGroup(config.testGroup);
		}).then(status => {
			testGroup = config.testGroup;
			// return oc.createFolder(testFolder);
			done();
		}).catch(error => {
			done();
		});
		/* jshint unused: true */
	});

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
			expect(status).tobe(null);
			done();
		}).catch(error => {
			expect(error).toBe("Please provide a valid owncloud instance");
			done();
		});
	});

	it('checking method : login with wrong username and password', function(done) {
		oc = new ownCloud(config.owncloudURL);

		oc.login('nonExistentUsername' + timeRightNow, 'nonExistentPassword').then(status => {
			expect(status).tobe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Current user is not logged in');
			done();
		});
	});

	it('checking method : login with correct username only', function(done) {
		oc = new ownCloud(config.owncloudURL);

		oc.login(config.username, 'nonExistentPassword' + timeRightNow).then(status => {
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

describe("Currently testing getConfig, getVersion and getCapabilities,", function () {
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
		oc.getApps().then(apps => {
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
			oc.setAttribute(config.appName, key[i], value[i]).then(status => {
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
			oc.getAttribute(config.appName, key[i]).then(data => {
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
			oc.getAttribute(config.appName, key[i]).then(data => {
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
		
		oc.getAttribute(config.appName).then(allAttributes => {
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
			oc.setAttribute(config.appName, key[i], '').then(status => {
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
			oc.getAttribute(config.appName, key[i]).then(value => {
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
			oc.deleteAttribute(config.appName, key[i]).then(status => {
				expect(status).toBe(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : enableApp when app exists', function (done) {
		oc.enableApp('files').then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : disableApp when app exists', function (done) {
		oc.disableApp('files').then(status => {
			expect(status).toBe(true);

			// Re-Enabling the Files App
			return oc.enableApp('files');
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : enableApp when app doesn\'t exist', function (done) {
		oc.enableApp('someAppWhichDoesntExists' + timeRightNow).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toEqual('No app found by the name "someAppWhichDoesntExists' + timeRightNow + '"');
			done();
		});
	});

	it('checking method : disableApp when app doesn\'t exist', function (done) {
		oc.disableApp('someAppWhichDoesntExists').then(status => {
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

	// UN-COMMENT AFTER COMPLETING deleteFile, deleteFolder
	// afterAll(function (done) {
	// 	oc = new ownCloud(config.owncloudURL);
	// 	oc.login(config.username, config.password, function() {});

	// 	var callback4 = function (error, data) {
	// 		done();
	// 	}

	// 	var callback3 = function (error, data) {
	// 		oc.deleteFolder(testFolder, callback4);
	// 	};
		
	// 	var callback2 = function (error, data) {
	// 		oc.deleteFile('existentFile', callback3);
	// 	};

	// 	var callback = function (error, data) {
	// 		oc.deleteGroup(testGroup, callback2);
	// 	};

	// 	oc.deleteUser(share2user, callback);
	// });

	// DELETE THIS METHOD AFTER COMPLETING deleteFile
	afterAll(function (done) {
		oc = new ownCloud(config.owncloudURL);

		oc.login(config.username, config.password).then(status => {
			expect(status).toBe(true);
			return oc.deleteUser(share2user);
		}).then(status => {
			expect(status).toBe(true);
			return oc.deleteGroup(testGroup);
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});


	it('checking method : shareFileWithLink with existent file', function (done) {
		var testFiles = config.testFile;
		var i;

		if (testFiles === '') {
			testFiles = ['/test.txt', '/test space and + and #.txt', '/文件.txt'];

			for (i=0;i<3;i++) {
				oc.putFileContents(testFiles[i], 'testContent');
			}
		}
		else {
			testFiles = [ oc._normalizePath(testFiles) ];
		}

		for (i=0;i<testFiles.length;i++) {
			oc.shareFileWithLink(testFiles[i]).then(share => {
				expect(share).not.toBe(null);
				expect(typeof(share)).toBe('object');
				expect(testFiles.indexOf(utf8.decode(share.getPath()))).toBeGreaterThan(-1);
				expect(typeof(share.getId())).toBe('number');
				expect(typeof(share.getLink())).toBe('string');
				expect(typeof(share.getToken())).toBe('string');
				sharedFilesByLink[share.getPath()] = share.getId();
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : shareFileWithLink with non-existent file', function (done) {
		var testFile = 'nonExistentTestFile' + timeRightNow;

		oc.shareFileWithLink(testFile, {password : 'testPassword'}).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	it('checking method : shareFileWithUser with existent File', function (done) {
		var testFiles = config.testFile;

		if (testFiles === '') {
			// already present since created in the previous to previous test
			testFiles = ['/test.txt', '/test space and + and #.txt', '/文件.txt'];
		}
		else {
			testFiles = [ oc._normalizePath(testFiles) ];
		}

		for (var i=0;i<testFiles.length;i++) {
			oc.shareFileWithUser(testFiles[i], config.owncloudShare2user).then(share => {
				expect(share).not.toBe(null);
				expect(typeof(share)).toBe('object');
				expect(typeof(share.getId())).toBe('number');
				shareIDs[share.getPath()] = share.getId();

				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : shareFileWithUser for the user file is shared with', function (done) {
		oc.login(share2user, "sharePassword").then(status => {
			expect(status).toBe(true);
			for (var key in shareIDs) {
				return oc.getShare(shareIDs[key]);
			}
		}).then(share => {
			expect(share).not.toBe(null);
			expect(typeof(share)).toBe('object');
			expect(typeof(share.getId())).toBe('number');
			expect(share.getShareWith()).toEqual(share2user);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : shareFileWithGroup with existent file', function (done) {
		for (var key in shareIDs) {
			oc.shareFileWithGroup(key, testGroup, {perms: 19}).then(share => {
				expect(typeof(share)).toEqual('object');
				expect(share.getPermissions()).toEqual(19);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : shareFileWithGroup with non existent file', function (done) {
		oc.shareFileWithGroup('nonExistentTestFile', testGroup, {perms: 19}).then(share => {
			expect(share).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	it('checking method : isShared with non existent file', function (done) {
		oc.isShared('nonExistentTestFile').then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	// PLEASE UN-COMMENT ME AFTER IMPLEMENTING "putFileContents"
	// it('checking method : isShared with non shared but existent file', function (done) {
	// 	var callback = function (error, data) {
	// 		expect(error).toBe('Wrong path, file/folder doesn\'t exist');
	// 		expect(data).toBe(null);

	// 		done();
	// 	};

	// 	var callback2 = function (error, data) {
	// 		expect(error).toBe(null);
	// 		expect(data).toBe(true);

	// 		oc.isShared('existentFile', callback);
	// 	};

	// 	oc.putFileContents('existentFile', 'testContent', callback2);
	// });

	it('checking method : isShared with shared file', function (done) {
		for (var key in shareIDs) {
			oc.isShared(key).then(status => {
				expect(status).toEqual(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : getShare with existent share', function (done) {
		for (var key in shareIDs) {
			oc.getShare(shareIDs[key]).then(share => {
				expect(typeof(share)).toBe('object');
				expect(shareIDs.hasOwnProperty(share.getId())).toBeGreaterThan(-1);
				done();				
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : getShare with non existent share', function (done) {
		oc.getShare(-1).then(share => {
			expect(share).toBe(null);
			done();
		}).catch(error => {
			expect(error).toEqual('Wrong share ID, share doesn\'t exist');
			done();
		});
	});

	it('checking method : getShares for shared file', function (done) {
		for (var key in shareIDs) {
			oc.getShares(key).then(shares => {
				expect(shares.constructor).toBe(Array);
				var flag = 0;
				for (var i=0;i<shares.length;i++) {
					var share = shares[i];
					if (shareIDs.hasOwnProperty(share.getId()) > -1) {
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
		oc.getShares('nonExistentTestFile').then(shares => {
			expect(shares).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	// PLEASE UN-COMMENT ME AFTER IMPLEMENTING "putFileContents"
	// it('checking method : getShares for existent but non shared file', function (done) {
	// 	var callback = function (error, data) {
	// 		expect(error).toBe('Wrong path, file/folder doesn\'t exist');
	// 		expect(data).toBe(null);

	// 		done();
	// 	};

	// 	// already have made a new non shared file in the test for isShared
	// 	oc.getShares('existentFile', callback);
	// });

	it('checking method : updateShare for existent share, editing permissions', function (done) {
		oc.shareFileWithLink(testFolder).then(share => {
			expect(typeof(share)).toBe('object');
			testFolderShareID = share.getId();
			return oc.updateShare(testFolderShareID, {perms: 31}); // max-permissions
		}).then(share => {
			expect(share).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Can\'t change permissions for public share links');
			done();
		});	
	});

	it('checking method : updateShare for existent share, confirming changed permissions', function (done) {
		oc.getShare(testFolderShareID).then(share => {
			// permissions would still be read only as the share is public
			expect(share.getPermissions()).toEqual(1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share, making publicUpload true', function (done) {
		oc.updateShare(testFolderShareID, {publicUpload: true}).then(data => {
			expect(data).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share, confirming publicUpload', function (done) {
		oc.getShare(testFolderShareID).then(share => {
			expect(share.getPermissions() & oc.OCS_PERMISSION_CREATE).toBeGreaterThan(0);
			expect(share.getPermissions() & oc.OCS_PERMISSION_UPDATE).toBeGreaterThan(0);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share, adding password', function (done) {
		oc.updateShare(testFolderShareID, {password: 'testPassword'}).then(status => {
			expect(status).toEqual(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share, confirming password', function (done) {
		oc.getShare(testFolderShareID).then(share => {
			expect(typeof(share.getShareWith())).toEqual('string');
			expect(typeof(share.getShareWithDisplayName())).toEqual('string');
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : updateShare for existent share with user, editing permissions', function (done) {
		var maxPerms = oc.OCS_PERMISSION_READ + oc.OCS_PERMISSION_UPDATE + oc.OCS_PERMISSION_SHARE;

		for (var key in shareIDs) {
			oc.updateShare(shareIDs[key], {perms: maxPerms}).then(status => {
				expect(status).toEqual(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : updateShare for existent share with user, confirming permissions', function (done) {
		var maxPerms = oc.OCS_PERMISSION_READ + oc.OCS_PERMISSION_UPDATE + oc.OCS_PERMISSION_SHARE;

		for (var key in shareIDs) {
			oc.getShare(shareIDs[key]).then(share => {
				expect(share.getPermissions()).toEqual(maxPerms);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : updateShare for non existent share', function (done) {
		oc.updateShare(-1).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Wrong share ID, share doesn\'t exist');
			done();
		});
	});

	it('checking method : deleteShare with existent share', function (done) {
		for (var key in shareIDs) {
			oc.getShare(shareIDs[key]).then(share => {
				expect(typeof(share)).toBe("object");
				this.id = share.getId();
				return oc.deleteShare(share.getId());
			}).then(status => {
				expect(status).toBe(true);
				return oc.getShare(this.id);
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
		oc.deleteShare(-1).then(status => {
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

	afterAll(function (done) {
		oc.deleteGroup(config.testGroup).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	beforeAll(function (done) {
		oc.createUser('existingUser' + timeRightNow, 'password').then(status => {
			expect(status).toBe(true);
			return oc.createGroup(config.testGroup);
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getUser on an existent user', function (done) {
		oc.getUser(config.username).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.displayname).toEqual(config.username);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getUser on a non existent user', function (done) {
		oc.getUser('nonExistentUsername' + timeRightNow).then(user => {
			expect(user).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('The requested user could not be found');
			done();
		});
	});

	it('checking method : createUser', function (done) {
		oc.getUser('existingUser' + timeRightNow).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.displayname).toEqual('existingUser' + timeRightNow);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : searchUsers', function (done) {
		oc.searchUsers('').then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.indexOf(config.username)).toBeGreaterThan(-1);
			expect(data.indexOf('existingUser' + timeRightNow)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : searchUsers with zero user results', function (done) {
		oc.searchUsers('nonExistentUsername' + timeRightNow).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.length).toEqual(0);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userExists with existent user', function (done) {
		oc.userExists(config.username).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userExists with non existent user', function (done) {
		oc.userExists('nonExistentUsername' + timeRightNow).then(status => {
			expect(status).toBe(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : setUserAttribute of an existent user, allowed attribute', function (done) {
		oc.setUserAttribute('existingUser' + timeRightNow, 'email', 'asd@a.com').then(data => {
			expect(data).toEqual(true);
			return oc.getUser('existingUser' + timeRightNow);
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
		oc.setUserAttribute('existingUser' + timeRightNow, 'email', 'äöüää_sfsdf+$%/)%&=')
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('102');
			done();
		});
	});

	it('checking method : setUserAttribute of a non existent user', function (done) {
		oc.setUserAttribute('nonExistingUser' + timeRightNow, 'email', 'asd@a.com').then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('997');
			done();
		});
	});

	it('checking method : addUserToGroup with existent user, existent group', function (done) {
		oc.addUserToGroup('existingUser' + timeRightNow, config.testGroup).then(status => {
			expect(status).toBe(true);
			return oc.userIsInGroup('existingUser' + timeRightNow, config.testGroup);
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : addUserToGroup with existent user, non existent group', function (done) {
		oc.addUserToGroup('existingUser' + timeRightNow, 'nonExistingGroup' + timeRightNow)
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('102');
			done();
		});
	});

	it('checking method : addUserToGroup with non existent user, existent group', function (done) {
		oc.addUserToGroup('nonExistentUsername' + timeRightNow, config.testGroup).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('103');
			done();
		});
	});

	it('checking method : getUserGroups with an existent user', function (done) {
		oc.getUserGroups('existingUser' + timeRightNow).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.indexOf(config.testGroup)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getUserGroups with a non existent user', function (done) {
		oc.getUserGroups('nonExistingUser' + timeRightNow).then(data => {
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
		oc.userIsInGroup('existingUser' + timeRightNow, config.testGroup).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInGroup with an existent user but a group the user isn\'t part of', function (done) {
		oc.userIsInGroup('existingUser' + timeRightNow, 'admin').then(status => {
			expect(status).toEqual(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInGroup with an existent user, non existent group', function (done) {
		oc.userIsInGroup('existingUser' + timeRightNow, 'nonExistingGroup' + timeRightNow)
		.then(status => {
			expect(status).toEqual(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInGroup with a non existent user', function (done) {
		oc.userIsInGroup('nonExistingUser' + timeRightNow, config.testGroup).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('998');
			done();
		});
	});

	it('checking method : getUser with an existent user', function (done) {
		oc.getUser('existingUser' + timeRightNow).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.displayname).toEqual('existingUser' + timeRightNow);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getUser with a non existent user', function (done) {
		oc.getUser('nonExistentUsername' + timeRightNow).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toEqual('The requested user could not be found');
			done();
		});
	});

	it('checking method : removeUserFromGroup with existent user, existent group', function (done) {
		oc.removeUserFromGroup('existingUser' + timeRightNow, config.testGroup).then(status => {
			expect(status).toBe(true);
			return oc.userIsInGroup('existingUser' + timeRightNow, config.testGroup);
		}).then(status => {
			expect(status).toBe(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : removeUserFromGroup with existent user, non existent group', function (done) {
		oc.removeUserFromGroup('existingUser' + timeRightNow, 'nonExistingGroup' + timeRightNow)
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
		oc.removeUserFromGroup('nonExistentUsername' + timeRightNow, config.testGroup)
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
		oc.addUserToSubadminGroup('existingUser' + timeRightNow, config.testGroup).then(status => {
			expect(status).toBe(true);
			return oc.userIsInSubadminGroup('existingUser' + timeRightNow, config.testGroup);			
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : addUserToSubadminGroup with existent user, non existent group', function (done) {
		oc.addUserToSubadminGroup('existingUser' + timeRightNow, 'nonExistingGroup' + timeRightNow)
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Group:nonExistingGroup' + timeRightNow + ' does not exist');
			done();
		});
	});

	it('checking method : addUserToSubadminGroup with non existent user, existent group', function (done) {
		oc.addUserToSubadminGroup('nonExistentUsername' + timeRightNow, config.testGroup).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('User does not exist');
			done();
		});
	});

	it('checking method : getUserSubadminGroups with an existent user', function (done) {
		oc.getUserSubadminGroups('existingUser' + timeRightNow).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.indexOf(config.testGroup)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getUserSubadminGroups with a non existent user', function (done) {
		oc.getUserSubadminGroups('nonExistentUsername' + timeRightNow).then(data => {
			expect(typeof(data)).toBe('object');
			expect(data.length).toEqual(0);
			done();
		}).catch(error => {
			expect(error).toBe('User does not exist');
			done();
		});
	});

	it('checking method : userIsInSubadminGroup with existent user, existent group', function (done) {
		oc.userIsInSubadminGroup('existingUser' + timeRightNow, config.testGroup).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInSubadminGroup with existent user, non existent group', function (done) {
		oc.userIsInSubadminGroup('existingUser' + timeRightNow, 'nonExistingGroup' + timeRightNow)
		.then(status => {
			expect(status).toBe(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : userIsInSubadminGroup with non existent user, existent group', function (done) {
		oc.userIsInSubadminGroup('nonExistentUsername' + timeRightNow, config.testGroup)
		.then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('User does not exist');
			done();
		});
	});

	it('checking method : deleteUser on a non existent user', function (done) {
		oc.deleteUser('nonExistingUser' + timeRightNow).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('101');
			done();
		});
	});

	it('checking method : deleteUser on an existent user', function (done) {
		oc.deleteUser('existingUser' + timeRightNow).then(status => {
			expect(status).toBe(true);
			return oc.getUser('existingUser' + timeRightNow);
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
		oc.createGroup(config.testGroup).then(status => {
			expect(status).toBe(true);
			return oc.groupExists(config.testGroup);
		}).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getGroups', function (done) {
		oc.getGroups().then(data => {
			expect(typeof(data)).toBe('object');
			expect(data.indexOf('admin')).toBeGreaterThan(-1);
			expect(data.indexOf(config.testGroup)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : groupExists with an existing group', function (done) {
		oc.groupExists('admin').then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : groupExists with a non existing group', function (done) {
		oc.groupExists('nonExistingGroup' + timeRightNow).then(status => {
			expect(status).toBe(false);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getGroupMembers', function (done) {
		oc.getGroupMembers('admin').then(data => {
			expect(typeof(data)).toBe('object');
			expect(data.indexOf(config.username)).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : deleteGroup with an existing group', function (done) {
		oc.deleteGroup(config.testGroup).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : deleteGroup with a non existing group', function (done) {
		oc.deleteGroup('nonExistingGroup' + timeRightNow).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(typeof(error)).toBe('object');
			expect(error.ocs.meta.statuscode).toEqual('101');
			done();
		});
	});
});