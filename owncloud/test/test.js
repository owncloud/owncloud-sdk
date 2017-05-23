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

describe("Currently testing Login and initLibrary,", function() {
	// UNCOMMENT INSIDE AFTER COMPLETING createFolder
	beforeAll(function (done) {
		oc = new ownCloud(config.owncloudURL);

		var callback3 = function (error, data) {
			done();
		};

		var callback2 = function (error, data) {
			if (!error && data === true) {
				testGroup = config.testGroup;
			}

			//oc.createFolder(testFolder, callback3);
			callback3(null, null);
		}

		var callback = function (error, data) {
			if (!error && data === true) {
				share2user = config.owncloudShare2user;
			}

			oc.createGroup(config.testGroup, callback2);
		};

		oc.login(config.username, config.password, function (error, data) {
			oc.createUser(config.owncloudShare2user, "sharePassword", callback);
		});
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

		var callback = function (error, data) {
			expect(error).not.toBe(null);
			expect(error).not.toBe(undefined);
			expect(data).toBe(null);

			done();
		};

		oc.login(config.username, config.password, callback);
	});

	it('checking method : login with wrong username and password', function(done) {
		oc = new ownCloud(config.owncloudURL);

		var callback = function (error, data) {
			expect(error).toBe('Current user is not logged in');
			expect(data).toBe(null);

			done();
		};

		oc.login('nonExistentUsername', 'nonExistentPassword', callback);
	});

	it('checking method : login with correct password only', function(done) {
		oc = new ownCloud(config.owncloudURL);

		var callback = function (error, data) {
			expect(error).toBe('Current user is not logged in');
			expect(data).toBe(null);

			done();
		};

		oc.login('nonExistentUsername', config.password, callback);
	});

	it('checking method : login with correct username only', function(done) {
		oc = new ownCloud(config.owncloudURL);

		var callback = function (error, data) {
			expect(error).toBe('Current user is not logged in');
			expect(data).toBe(null);

			done();
		};

		oc.login(config.username, 'nonExistentPassword', callback);
	});

	it('checking method : login with correct username and password', function(done) {
		oc = new ownCloud(config.owncloudURL);

		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			done();
		};

		oc.login(config.username, config.password, callback);
	});
});

describe("Currently testing getConfig, getVersion and getCapabilities,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password, function() {});
	});

	it('checking method : getConfig', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);
			expect(typeof(data)).toBe('object');

			done();
		};

		oc.getConfig(callback);
	});

	it('checking method : getVersion', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);
			expect(typeof(data)).toBe('string');
			expect(data.split('.').length).toBeGreaterThan(2);

			done();
		};

		oc.getVersion(callback);
	});

	it('checking method : getCapabilities', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);
			expect(typeof(data)).toBe('object');
			
			// Files App is never disabled
			expect(data.files).not.toBe(null);
			expect(data.files).not.toBe(undefined);
			
			// Big file chunking of files app is always on
			expect(parseInt(data.files.bigfilechunking)).toEqual(1);

			done();
		};

		oc.getCapabilities(callback);
	});
});

describe("Currently testing apps management,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password, function() {});
	});

	it('checking method : getApps', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);
			expect(typeof(data)).toBe('object');
			expect(data.files).toBe(true);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : setAttribute', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			done();
		};
		
		key = ['attr1', 'attr+plus space', '属性1'];
		value = ['value1', 'value+plus space and/slash', '值对1'];

		for (i=0;i<key.length;i++) {
			oc.setAttribute(config.appName, key[i], value[i], callback);
		}
	});

	it('checking method : valid getAttribute', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];
		var value = ['value1', 'value+plus space and/slash', '值对1'];
		
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(value.indexOf(utf8.decode(data))).toBeGreaterThan(-1);

			done();
		};

		for (i=0;i<key.length;i++) {
			oc.getAttribute(config.appName, key[i], callback);
		}
	});

	it('checking method : non existent getAttribute', function (done) {
		var key = ['attr2', 'attr+plus space ', '属性12'];
		
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(undefined);

			done();
		};

		for (i=0;i<key.length;i++) {
			oc.getAttribute(config.appName, key[i], callback);
		}
	});

	it('checking method : getAttribute without key', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];
		var value = ['value1', 'value+plus space and/slash', '值对1']
		var test = {};

		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toEqual(test);

			done();
		};

		for (i=0;i<key.length;i++) {
			test[utf8.encode(key[i])] = utf8.encode(value[i]);
		}

		oc.getAttribute(config.appName, callback);
	});

	it('checking method : setAttribute with empty value', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];

		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			done();
		};

		for (i=0;i<key.length;i++) {
			oc.setAttribute(config.appName, key[i], '', callback);
		}
	});

	it('checking method : getAttribute with empty value', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];

		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe('');

			done();
		};

		for (i=0;i<key.length;i++) {
			oc.getAttribute(config.appName, key[i], callback);
		}
	});

	it('checking method : deleteAttribute', function (done) {
		var key = ['attr1', 'attr+plus space', '属性1'];

		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			done();
		};

		for (i=0;i<key.length;i++) {
			oc.deleteAttribute(config.appName, key[i], callback);
		}
	});

	it('checking method : enableApp when app exists', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			done();
		};

		oc.enableApp('files', callback);
	});

	it('checking method : disableApp when app exists', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			// Re-enabling the app (JUST IN CASE)
			oc.enableApp('files', function (error, data) {});

			done();
		};

		oc.disableApp('files', callback);
	});

	it('checking method : enableApp when app doesn\'t exist', function (done) {
		var callback = function (error, data) {
			expect(error).toBe('No app found by the name "someAppWhichDoesntExists"');
			expect(data).toBe(null);

			done();
		};

		oc.enableApp('someAppWhichDoesntExists', callback);
	});

	it('checking method : disableApp when app doesn\'t exist', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			done();
		};

		oc.disableApp('someAppWhichDoesntExists', callback);
	});
});

describe("Currently testing file/folder sharing,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password, function() {});
	});

	// UN-COMMENT AFTER COMPLETING deleteFile, deleteFolder
	/*afterAll(function (done) {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password, function() {});

		var callback4 = function (error, data) {
			done();
		}

		var callback3 = function (error, data) {
			oc.deleteFolder(testFolder, callback4);
		};
		
		var callback2 = function (error, data) {
			oc.deleteFile('existentFile', callback3);
		};

		var callback = function (error, data) {
			oc.deleteGroup(testGroup, callback2);
		};

		oc.deleteUser(share2user, callback);
	});*/

	// DELETE THIS METHOD AFTER COMPLETING deleteFile
	afterAll(function (done) {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password, function() {});
		
		var callback2 = function (error, data) {
			done();
		};

		var callback = function (error, data) {
			oc.deleteGroup(testGroup, callback2);
		};

		oc.deleteUser(share2user, callback);
	});

	it('checking method : shareFileWithLink with existent file', function (done) {
		var testFiles = config.testFile;

		if (testFiles === '') {
			testFiles = ['/test.txt', '/test space and + and #.txt', '/文件.txt'];

			for (var i=0;i<3;i++) {
				oc.putFileContents(testFiles[i], 'testContent', function (error, data) {});
			}
		}
		else {
			testFiles = [ oc._normalizePath(testFiles) ];
		}
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);
			expect(typeof(data)).toBe('object');
			expect(testFiles.indexOf(utf8.decode(data.getPath()))).toBeGreaterThan(-1);
			expect(typeof(data.getId())).toBe('number');
			expect(typeof(data.getLink())).toBe('string');
			expect(typeof(data.getToken())).toBe('string');
			sharedFilesByLink[data.getPath()] = data.getId();

			done();
		};

		for (var i=0;i<testFiles.length;i++) {
			oc.shareFileWithLink(testFiles[i], callback);
		}
	});

	it('checking method : shareFileWithLink with non-existent file', function (done) {
		var testFile = 'nonExistentTestFile' + new Date().getTime();

		var callback = function (error, data) {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			expect(data).toBe(null);
			
			done();
		};

		oc.shareFileWithLink(testFile, {password : 'testPassword'}, callback);
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

		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);
			expect(typeof(data)).toBe('object');
			expect(typeof(data.getId())).toBe('number');
			shareIDs[data.getPath()] = data.getId();

			done();
		};

		for (var i=0;i<testFiles.length;i++) {
			oc.shareFileWithUser(testFiles[i], config.owncloudShare2user, callback);
		}
	});

	it('checking method : shareFileWithUser for the user file is shared with', function (done) {
		oc.login(share2user, "sharePassword", function (error, data) {
			for (var key in shareIDs) {
				oc.getShare(shareIDs[key], callback);
			}
		});

		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);
			expect(typeof(data)).toBe('object');
			expect(typeof(data.getId())).toBe('number');
			expect(data.getShareWith()).toEqual(share2user);

			done();
		};
	});

	it('checking method : shareFileWithGroup with existent file', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(typeof(data)).toBe("object");
			expect(data.getPermissions()).toEqual(19);

			done();
		};

		for (var key in shareIDs) {
			oc.shareFileWithGroup(key, testGroup, {perms: 19}, callback);
		}
	});

	it('checking method : shareFileWithGroup with non existent file', function (done) {
		var callback = function (error, data) {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			expect(data).toBe(null);

			done();
		};

		for (var key in shareIDs) {
			oc.shareFileWithGroup('nonExistentTestFile', testGroup, {perms: 19}, callback);
		}
	});

	it('checking method : isShared with non existent file', function (done) {
		var callback = function (error, data) {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			expect(data).toBe(false);

			done();
		};

		oc.isShared('nonExistentTestFile', callback);
	});

	// PLEASE UN-COMMENT ME AFTER IMPLEMENTING "putFileContents"
	/*it('checking method : isShared with non shared but existent file', function (done) {
		var callback = function (error, data) {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			expect(data).toBe(null);

			done();
		};

		var callback2 = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			oc.isShared('existentFile', callback);
		};

		oc.putFileContents('existentFile', 'testContent', callback2);
	});*/

	it('checking method : isShared with shared file', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			done();
		};

		for (var key in shareIDs) {
			oc.isShared(key, callback);
		}
	});

	it('checking method : getShare with existent share', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(typeof(data)).toBe('object');
			expect(shareIDs.hasOwnProperty(data.getId())).toBeGreaterThan(-1);

			done();
		};

		for (var key in shareIDs) {
			oc.getShare(shareIDs[key], callback);
		}
	});

	it('checking method : getShare with existent share', function (done) {
		var callback = function (error, data) {
			expect(error).toEqual('Wrong share ID, share doesn\'t exist');
			expect(data).toBe(null);

			done();
		};

		for (var key in shareIDs) {
			oc.getShare(-1, callback);
		}
	});

	it('checking method : getShares for shared file', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(typeof(data)).toBe('object');
			var flag = 0;
			for (var i=0;i<data.length;i++) {
				var share = data[i];
				if (shareIDs.hasOwnProperty(share.getId()) > -1) {
					flag = 1;
				}
			}
			expect(flag).toEqual(1);

			done();
		};

		for (var key in shareIDs) {
			oc.getShares(key, callback);
		}
	});

	it('checking method : getShares for non existent file', function (done) {
		var callback = function (error, data) {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			expect(typeof(data)).toBe('object');
			expect(data.length).toEqual(0);
			
			done();
		};

		for (var key in shareIDs) {
			oc.getShares('nonExistentTestFile', callback);
		}
	});

	// PLEASE UN-COMMENT ME AFTER IMPLEMENTING "putFileContents"
	/*it('checking method : getShares for existent but non shared file', function (done) {
		var callback = function (error, data) {
			expect(error).toBe('Wrong path, file/folder doesn\'t exist');
			expect(data).toBe(null);

			done();
		};

		// already have made a new non shared file in the test for isShared
		oc.getShares('existentFile', callback);
	});*/

	it('checking method : updateShare for existent share, editing permissions', function (done) {
		var callback3 = function (error, data) {
			expect(error).toBe('Can\'t change permissions for public share links');
			expect(data).toBe(null);

			done();
		};

		var callback2 = function (error, data) {
			expect(error).toBe(null);
			expect(typeof(data)).toBe('object');
			testFolderShareID = data.getId();
			oc.updateShare(testFolderShareID, {perms: 31}, callback3); // max-permissions
		};

		oc.shareFileWithLink(testFolder, callback2);	
	});

	it('checking method : updateShare for existent share, confirming changed permissions', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			// permissions would still be read only as the share is public
			expect(data.getPermissions()).toEqual(1);
			
			done();
		};

		oc.getShare(testFolderShareID, callback);
	});

	it('checking method : updateShare for existent share, making publicUpload true', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			done();
		};

		oc.updateShare(testFolderShareID, {publicUpload: true}, callback);
	});

	it('checking method : updateShare for existent share, confirming publicUpload', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data.getPermissions() & oc.OCS_PERMISSION_CREATE).toBeGreaterThan(0);
			expect(data.getPermissions() & oc.OCS_PERMISSION_UPDATE).toBeGreaterThan(0);

			done();
		};

		oc.getShare(testFolderShareID, callback);
	});

	it('checking method : updateShare for existent share, adding password', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			done();
		};

		oc.updateShare(testFolderShareID, {password: 'testPassword'}, callback);
	});

	it('checking method : updateShare for existent share, confirming password', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(typeof(data.getShareWith())).toEqual('string');
			expect(typeof(data.getShareWithDisplayName())).toEqual('string');

			done();
		};

		oc.getShare(testFolderShareID, callback);
	});

	it('checking method : updateShare for existent share with user, editing permissions', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toEqual(true);

			done();
		};

		var maxPerms = oc.OCS_PERMISSION_READ + oc.OCS_PERMISSION_UPDATE + oc.OCS_PERMISSION_SHARE;

		for (var key in shareIDs) {
			oc.updateShare(shareIDs[key], {perms: maxPerms}, callback);
		}
	});

	it('checking method : updateShare for existent share with user, confirming permissions', function (done) {
		var maxPerms = oc.OCS_PERMISSION_READ + oc.OCS_PERMISSION_UPDATE + oc.OCS_PERMISSION_SHARE;
		
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data.getPermissions()).toEqual(maxPerms);

			done();
		};

		for (var key in shareIDs) {
			oc.getShare(shareIDs[key], callback);
		}
	});

	it('checking method : updateShare for non existent share', function (done) {
		var callback = function (error, data) {
			expect(error).toBe('Wrong share ID, share doesn\'t exist');
			expect(data).toBe(null);

			done();
		};

		oc.updateShare(-1, callback);
	});

	it('checking method : deleteShare with existent share', function (done) {
		var callbackFalse = function (error, data) {
			expect(error).toEqual('Wrong share ID, share doesn\'t exist');
			expect(data).toBe(null);

			done();
		};

		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).toBe(true);

			oc.getShare(this.id, callbackFalse);
		};

		var callbackTrue = function (error, data) {
			expect(error).toBe(null);
			expect(typeof(data)).toBe("object");
			this.id = data.getId();

			oc.deleteShare(data.getId(), callback);
		};

		for (var key in shareIDs) {
			oc.getShare(shareIDs[key], callbackTrue);
		}
	});

	it('checking method : deleteShare with non existent share', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			//ownCloud API somehow returns no error when a non-existent share is deleted
			expect(data).toBe(true);

			done();
		};

		oc.deleteShare(-1, callback);
	});
});

/*describe("Currently testing user management,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password, function() {});
	});
});

describe("Currently testing group management,", function () {
	beforeEach(function () {
		oc = new ownCloud(config.owncloudURL);
		oc.login(config.username, config.password, function() {});
	});

	it('checking method : createGroup', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : deleteGroup', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : getGroups', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : getGroupMembers', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : groupExists', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});
});*/