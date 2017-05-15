var config = require('./config.js');
var ownCloud = require("../index.js");
var utf8 = require('utf8');
var oc;

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

	it('checking method : shareFileWithLink', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : updateShare', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : shareFileWithUser', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : shareFileWithGroup', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : getShares', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : isShared', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : getShare', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : listOpenRemoteShare', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : acceptOpenRemoteShare', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : declineOpenRemoteShare', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});

	it('checking method : deleteShare', function (done) {
		var callback = function (error, data) {
			expect(error).toBe(null);
			expect(data).not.toBe(null);

			done();
		};

		oc.getApps(callback);
	});
});

describe("Currently testing user management,", function () {
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
});