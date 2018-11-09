////////////////////////////////////////////
///////    UN-AUTHENTICATED TESTS    ///////
////////////////////////////////////////////

console.log("Running Un-Authenticated tests i.e tests without specifying a username and password");

var config = require('./config.json');
var ownCloud = require("../index.js");

// CURRENT TIME
var timeRightNow = new Date().getTime();

// LIBRARY INSTANCE
var oc;

// TESTING CONFIGS
var testUserPassword = 'password';
var testContent = 'testContent';
var username = config.username;
var downloadBasePath = __dirname + '/testDownloadDir/';
var localFile = downloadBasePath + 'file' + timeRightNow + '.txt';
var owncloudURL = config.owncloudURL;
var testUser = 'testUser' + timeRightNow;
var testGroup = 'testGroup' + timeRightNow;
var testFolder = '/testFolder' + timeRightNow;
var testApp = 'someAppName' + timeRightNow;
var nonExistingFile = 'nonExistingFile' + timeRightNow;
var nonExistingUser = 'nonExistingUser' + timeRightNow;
var testFiles = [
    '/文件' + timeRightNow + '.txt',
    '/test' + timeRightNow + '.txt',
    '/test space and + and #' + timeRightNow + '.txt'
];
var testSubFiles = [
    testFolder + '/' + 'file one.txt',
    testFolder + '/' + 'zz+z.txt',
    testFolder + '/' + '中文.txt',
    testFolder + '/' + 'abc.txt',
    testFolder + '/' + 'subdir/in dir.txt'
];

// CREATED SHARES
var sharedFilesWithUser = {
    1: '1',
    2: '2'
};

// COMMON ERRORS
const ERROR_NO_AUTHORIZATION = "Please specify an authorization first.";

describe("Currently testing getConfig, getVersion and getCapabilities", function() {
    beforeEach(function() {
        oc = new ownCloud(owncloudURL);
    });

    it('checking method : getVersion', function(done) {
        oc.getVersion().then(version => {
            expect(version).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : getCapabilities', function(done) {
        oc.getCapabilities().then(capabilities => {
            expect(capabilities).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });
});

describe("Currently testing apps management,", function() {
    beforeEach(function() {
        oc = new ownCloud(owncloudURL);
    });

    it('checking method : getApps', function(done) {
        oc.apps.getApps().then(apps => {
            expect(apps).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : setAttribute', function(done) {
        var key = ['attr1', 'attr+plus space', '属性1'];
        var value = ['value1', 'value+plus space and/slash', '值对1'];
        var count = 0;

        for (var i = 0; i < key.length; i++) {
            oc.apps.setAttribute(testApp, key[i], value[i]).then(status => {
                expect(status).toBe(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === key.length) {
                    done();
                }
            });
        }
    });

    it('checking method : getAttribute', function(done) {
        var key = ['attr1', 'attr+plus space', '属性1'];
        var count = 0;

        for (var i = 0; i < key.length; i++) {
            oc.apps.getAttribute(testApp, key[i]).then(data => {
                expect(data).toBe(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === key.length) {
                    done();
                }
            });
        }
    });

    it('checking method : setAttribute', function(done) {
        var key = ['attr1', 'attr+plus space', '属性1'];
        var count = 0;
        for (var i = 0; i < key.length; i++) {
            oc.apps.setAttribute(testApp, key[i], '').then(status => {
                expect(status).toBe(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === key.length) {
                    done();
                }
            });
        }
    });

    it('checking method : deleteAttribute', function(done) {
        var key = ['attr1', 'attr+plus space', '属性1'];
        var count = 0;

        for (var i = 0; i < key.length; i++) {
            oc.apps.deleteAttribute(testApp, key[i]).then(status => {
                expect(status).toBe(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === key.length) {
                    done();
                }
            });
        }
    });

    it('checking method : enableApp', function(done) {
        oc.apps.enableApp('files').then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : disableApp', function(done) {
        oc.apps.disableApp('files').then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });
});

describe("Currently testing file/folder sharing,", function() {
    beforeEach(function() {
        oc = new ownCloud(owncloudURL);
    });

    it('checking method : shareFileWithLink', function(done) {
        var count = 0;

        for (var i = 0; i < testFiles.length; i++) {
            oc.shares.shareFileWithLink(testFiles[i]).then(share => {
                expect(share).toBe(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === testFiles.length) {
                    done();
                }
            });
        }
    });

    it('checking method : shareFileWithUser', function(done) {
        var count = 0;

        for (var i = 0; i < testFiles.length; i++) {
            oc.shares.shareFileWithUser(testFiles[i], testUser).then(share => {
                expect(share).toBe(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === testFiles.length) {
                    done();
                }
            });
        }
    });

    it('checking method : shareFileWithGroup', function(done) {
        var count = 0;

        for (var i = 0; i < testFiles.length; i++) {
            oc.shares.shareFileWithGroup(testFiles[i], testGroup, {
                perms: 19
            }).then(share => {
                expect(share).toEqual(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === testFiles.length) {
                    done();
                }
            });
        }
    });

    it('checking method : isShared', function(done) {
        oc.shares.isShared(nonExistingFile).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : getShare', function(done) {
        var count = 0;

        for (var key in sharedFilesWithUser) {
            oc.shares.getShare(sharedFilesWithUser[key]).then(share => {
                expect(share).toBe(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === Object.keys(sharedFilesWithUser).length) {
                    done();
                }
            });
        }
    });

    it('checking method : getShares', function(done) {
        var count = 0;

        for (var key in sharedFilesWithUser) {
            oc.shares.getShares(key).then(shares => {
                expect(shares).toBe(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === Object.keys(sharedFilesWithUser).length) {
                    done();
                }
            });
        }
    });

    it('checking method : updateShare', function(done) {
        oc.shares.shareFileWithLink(testFolder).then(share => {
            expect(share).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : deleteShare', function(done) {
        oc.shares.deleteShare(123).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });
});

describe("Currently testing user management,", function() {
    beforeEach(function() {
        oc = new ownCloud(owncloudURL);
    });

    it('checking method : getUser', function(done) {
        oc.users.getUser(username).then(data => {
            expect(data).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : createUser', function(done) {
        oc.users.createUser('newUser' + timeRightNow, testUserPassword).then(data => {
            expect(data).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : searchUsers', function(done) {
        oc.users.searchUsers('').then(data => {
            expect(data).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : userExists', function(done) {
        oc.users.userExists(username).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : setUserAttribute', function(done) {
        oc.users.setUserAttribute(testUser, 'email', 'asd@a.com').then(data => {
            expect(data).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : addUserToGroup', function(done) {
        oc.users.addUserToGroup(testUser, testGroup).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : getUserGroups', function(done) {
        oc.users.getUserGroups(testUser).then(data => {
            expect(data).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : userIsInGroup', function(done) {
        oc.users.userIsInGroup(testUser, testGroup).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : getUser', function(done) {
        oc.users.getUser(testUser).then(data => {
            expect(data).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : removeUserFromGroup', function(done) {
        oc.users.removeUserFromGroup(testUser, testGroup).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : addUserToSubadminGroup', function(done) {
        oc.users.addUserToSubadminGroup(testUser, testGroup).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : getUserSubadminGroups', function(done) {
        oc.users.getUserSubadminGroups(testUser).then(data => {
            expect(data).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : userIsInSubadminGroup', function(done) {
        oc.users.userIsInSubadminGroup(testUser, testGroup).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : deleteUser', function(done) {
        oc.users.deleteUser(nonExistingUser).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });
});

describe("Currently testing group management,", function() {
    beforeEach(function() {
        oc = new ownCloud(owncloudURL);
    });

    it('checking method : createGroup', function(done) {
        oc.groups.createGroup('newGroup' + timeRightNow).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : getGroups', function(done) {
        oc.groups.getGroups().then(data => {
            expect(data).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : groupExists', function(done) {
        oc.groups.groupExists('admin').then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : getGroupMembers', function(done) {
        oc.groups.getGroupMembers('admin').then(data => {
            expect(data).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : deleteGroup', function(done) {
        oc.groups.deleteGroup(testGroup).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });
});

describe("Currently testing files management,", function() {
    beforeEach(function() {
        oc = new ownCloud(owncloudURL);
    });

    it('checking method : list', function(done) {
        oc.files.list(testFolder, 1).then(files => {
            expect(files).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : getFileContents', function(done) {
        var count = 0;

        for (var i = 0; i < testSubFiles.length; i++) {
            oc.files.getFileContents(testSubFiles[i]).then(content => {
                expect(content).toBe(null);
                done();
            }).catch(error => {
                expect(error).toBe(ERROR_NO_AUTHORIZATION);
                count++;
                if (count === testSubFiles.length) {
                    done();
                }
            });
        }
    });

    it('checking method : putFileContents', function(done) {
        var newFile = testFolder + '/' + 'file.txt';

        oc.files.putFileContents(newFile, testContent).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : mkdir', function(done) {
        var newFolder = testFolder + '/' + 'new folder/';

        oc.files.mkdir(newFolder).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : delete', function(done) {
        var newFolder = testFolder + '/' + 'new folder';

        oc.files.mkdir(newFolder).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : getFile', function(done) {
        var file = 'tempFile' + timeRightNow;

        oc.files.putFileContents(file, testContent).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : putFile', function(done) {
        try {
            oc.files.putFile('/', localFile).then(status => {
                expect(status).toBe(null);
                done();
            }).catch(error => {
                expect(error.toString()).toBe(
                    'Error: ENOENT: no such file or directory, stat \'' + localFile + '\''
                );
                done();
            });
        } catch (error) {
            expect(error.toString()).toBe(
                'Error: ENOENT: no such file or directory, stat \'' + localFile + '\''
            );
            done();
        }
    });

    it('checking method : putDirectory', function(done) {
        oc.files.putDirectory('/', downloadBasePath).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : move', function(done) {
        oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });

    it('checking method : copy', function(done) {
        oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe(ERROR_NO_AUTHORIZATION);
            done();
        });
    });
});
