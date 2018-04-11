////////////////////////////////
///////    MAIN TESTS    ///////
////////////////////////////////

console.log("Running Main tests");

jasmine.getEnv().defaultTimeoutInterval = 20000; // 20 Seconds

var config = require('./config.json');
var ownCloud = require("../index.js");
var utf8 = require('utf8');
var fs = require('fs');
var JSZip = require("jszip");

// CURRENT TIME
var timeRightNow = new Date().getTime();

// LIBRARY INSTANCE
var oc;

// TESTING CONFIGS
var testUserPassword = 'password';
var testContent = 'testContent';
var username = config.username;
var password = config.password;
var downloadBasePath = __dirname + '/testDownloadDir/';
var localFile = downloadBasePath + 'file' + timeRightNow + '.txt';
var owncloudURL = config.owncloudURL;
var testUser = 'testUser' + timeRightNow;
var testGroup = 'testGroup' + timeRightNow;
var testFolder = '/testFolder' + timeRightNow;
var testSubDir = testFolder + '/' + 'subdir';
var nonExistingDir = testFolder + '/' + 'nonExistingDir';
var testApp = 'someAppName' + timeRightNow;
var nonExistingApp = 'nonExistingApp' + timeRightNow;
var nonExistingFile = 'nonExistingFile' + timeRightNow;
var nonExistingUser = 'nonExistingUser' + timeRightNow;
var nonExistingGroup = 'nonExistingGroup' + timeRightNow;

var testFiles   	 = [
					   '/文件' + timeRightNow + '.txt',
					   '/test' + timeRightNow + '.txt',
					   '/test space and + and #' + timeRightNow + '.txt'
					   ];
var testSubFiles	 = [
					   testFolder + '/' + 'file one.txt',
					   testFolder + '/' + 'zz+z.txt',
					   testFolder + '/' + '中文.txt',
					   testFolder + '/' + 'abc.txt',
					   testFolder + '/' + 'subdir/in dir.txt'
					   ];

// CREATED SHARES
var sharedFilesWithUser = {};
var sharedFilesByLink = {};
var sharedFilesWithGroup = {};
var testFolderShareID = null;
var allShareIDs = [];

// CONSTANTS FROM lib/public/constants.php
var OCS_PERMISSION_READ = 1;
var OCS_PERMISSION_UPDATE = 2;
var OCS_PERMISSION_CREATE = 4;
var OCS_PERMISSION_SHARE = 16;

describe("Currently testing Login and initLibrary,", function() {
    beforeEach(function() {
        oc = null;
    });

    it('checking method : initLibrary to be null', function() {
        expect(oc).toBe(null);
    });

    it('checking method : initLibrary', function() {
        oc = new ownCloud('someRandomName');

        expect(oc).not.toBe(null);
    });

    it('checking method : login with a non existent instance URL', function(done) {
        oc = new ownCloud('someRandomName');

        oc.login(username, password).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe("Please provide a valid owncloud instance");
            done();
        });
    });

    it('checking method : login with wrong username and password', function(done) {
        oc = new ownCloud(owncloudURL);

        oc.login(nonExistingUser, 'password' + timeRightNow).then(status => {
            expect(status).tobe(null);
            done();
        }).catch(error => {
            var check = 'Current user is not logged in';
            if (error === 'Unauthorised') {
                check = 'Unauthorised';
            }
            expect(error).toBe(check);
            done();
        });
    });

    it('checking method : login with correct username only', function(done) {
        oc = new ownCloud(owncloudURL);

        oc.login(username, 'password' + timeRightNow).then(status => {
            expect(status).tobe(null);
            done();
        }).catch(error => {
            var check = 'Current user is not logged in';
            if (error === 'Unauthorised') {
                check = 'Unauthorised';
            }
            expect(error).toBe(check);
            done();
        });
    });

    it('checking method : login with correct username and password', function(done) {
        oc = new ownCloud(owncloudURL);

        oc.login(username, password).then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
        	console.log(error);
            expect(error).toBe(null);
            done();
        });
    });
});

describe("Currently testing getConfig, getVersion and getCapabilities", function () {
	beforeEach(function () {
		oc = new ownCloud(owncloudURL);
		oc.login(username, password);
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

describe("Currently testing apps management,", function() {
    beforeEach(function() {
        oc = new ownCloud(owncloudURL);
        oc.login(username, password);
    });

    it('checking method : getApps', function(done) {
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

	describe("App attributes testing,", function() {
			beforeEach(function(done) {
				var key = ['attr1', 'attr+plus space', '属性1'];
		        var value = ['value1', 'value+plus space and/slash', '值对1'];
		        var count = 0;

		        for (var i = 0; i < key.length; i++) {
		            oc.apps.setAttribute(testApp, key[i], value[i]).then(status => {
		                expect(status).toBe(true);
		                count++;
		                if (count === key.length) {
		                    done();
		                }
		            }).catch(error => {
		                expect(error).toBe(null);
		                done();
		            });
		        }
			});

			afterEach(function(done) {
				var key = ['attr1', 'attr+plus space', '属性1'];
		        var count = 0;

		        for (var i = 0; i < key.length; i++) {
		            oc.apps.deleteAttribute(testApp, key[i]).then(status => {
		                expect(status).toBe(true);
		                count++;
		                if (count === key.length) {
		                    done();
		                }
		            }).catch(error => {
		                expect(error).toBe(null);
		                done();
		            });
		        }
			});

            it('checking method : valid getAttribute', function(done) {
                var key = ['attr1', 'attr+plus space', '属性1'];
                var value = ['value1', 'value+plus space and/slash', '值对1'];
                var count = 0;

                for (var i = 0; i < key.length; i++) {
                    oc.apps.getAttribute(testApp, key[i]).then(data => {
                        expect(value.indexOf(utf8.decode(data))).toBeGreaterThan(-1);
                        count++;
                        if (count === key.length) {
                            done();
                        }
                    }).catch(error => {
                        expect(error).toBe(null);
                        done();
                    });
                }
            });

            it('checking method : non existent getAttribute', function(done) {
                var key = ['attr ', 'attr+plus space ', '属性1 '];
                var count = 0;

                for (var i = 0; i < key.length; i++) {
                    oc.apps.getAttribute(testApp, key[i]).then(data => {
                        expect(data).toEqual(null);
                        done();
                    }).catch(error => {
                        var fl = 0;
                        for (var j = 0; j < key.length; j++) {
                            if (error === testApp + ' has no key named "' + key[j] + '"') {
                                fl = 1;
                            }
                        }
                        expect(fl).toBe(1);
                        count++;
                        if (count === key.length) {
                            done();
                        }
                    });
                }
            });

            it('checking method : getAttribute without key', function(done) {
                var key = ['attr1', 'attr+plus space', '属性1'];
                var value = ['value1', 'value+plus space and/slash', '值对1'];
                var count = 0;

                oc.apps.getAttribute(testApp).then(allAttributes => {
                    for (var i = 0; i < key.length; i++) {
                        expect(typeof(allAttributes)).toBe('object');
                        expect(utf8.encode(key[i]) in allAttributes).toBe(true);
                        var ocValue = utf8.decode(allAttributes[utf8.encode(key[i])]);
                        expect(value.indexOf(ocValue)).toBeGreaterThan(-1);
                        count++;
                        if (count === key.length) {
                            done();
                        }
                    }
                }).catch(error => {
                    expect(error).toBe(null);
                    done();
                });
            });
	});

    describe("App attributes testing with empty value,", function() {
			beforeEach(function(done) {
				var key = ['attr1', 'attr+plus space', '属性1'];
		        var count = 0;

		        for (var i = 0; i < key.length; i++) {
		            oc.apps.setAttribute(testApp, key[i], '').then(status => {
		                expect(status).toBe(true);
		                count++;
		                if (count === key.length) {
		                    done();
		                }
		            }).catch(error => {
		                expect(error).toBe(null);
		                done();
		            });
		        }
			});

			afterEach(function(done) {
				var key = ['attr1', 'attr+plus space', '属性1'];
		        var count = 0;

		        for (var i = 0; i < key.length; i++) {
		            oc.apps.deleteAttribute(testApp, key[i]).then(status => {
		                expect(status).toBe(true);
		                count++;
		                if (count === key.length) {
		                    done();
		                }
		            }).catch(error => {
		                expect(error).toBe(null);
		                done();
		            });
		        }
			});

            it('checking method : valid getAttribute', function(done) {
                var key = ['attr1', 'attr+plus space', '属性1'];
                var count = 0;

                for (var i = 0; i < key.length; i++) {
                    oc.apps.getAttribute(testApp, key[i]).then(data => {
                        expect(utf8.decode(data)).toBe('');
                        count++;
                        if (count === key.length) {
                            done();
                        }
                    }).catch(error => {
                        expect(error).toBe(null);
                        done();
                    });
                }
            });

            it('checking method : getAttribute without key', function(done) {
                var key = ['attr1', 'attr+plus space', '属性1'];
                var count = 0;

                oc.apps.getAttribute(testApp).then(allAttributes => {
                    for (var i = 0; i < key.length; i++) {
                        expect(typeof(allAttributes)).toBe('object');
                        expect(utf8.encode(key[i]) in allAttributes).toBe(true);
                        var ocValue = utf8.decode(allAttributes[utf8.encode(key[i])]);
                        expect(ocValue).toBe('');
                        count++;
                        if (count === key.length) {
                            done();
                        }
                    }
                }).catch(error => {
                    expect(error).toBe(null);
                    done();
                });
            });
	});

    it('checking method : enableApp when app exists', function(done) {
        oc.apps.enableApp('files').then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
    });

    it('checking method : disableApp when app exists', function(done) {
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

    it('checking method : enableApp when app doesn\'t exist', function(done) {
        oc.apps.enableApp(nonExistingApp).then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
            expect(error).toEqual('No app found by the name "' + nonExistingApp + '"');
            done();
        });
    });

    it('checking method : disableApp when app doesn\'t exist', function(done) {
        oc.apps.disableApp(nonExistingApp).then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
    });
});

describe("Currently testing folder sharing,", function () {
    beforeEach(function (done) {
		oc = new ownCloud(owncloudURL);
		oc.login(username, password);

        oc.files.createFolder(testFolder).then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
	});

	afterEach(function (done) {
		oc.files.delete(testFolder).then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
	});

    describe("sharedFolder,", function() {
        beforeEach(function(done) {
            oc.shares.shareFileWithLink(testFolder).then(share => {
    			expect(typeof(share)).toBe('object');
    			testFolderShareID = share.getId();
    			allShareIDs.push(testFolderShareID);
                done();
            }).catch(error => {
                expect(error).toBe(null);
                done();
            });
        });

        afterEach(function(done) {
            oc.shares.deleteShare(testFolderShareID).then(status => {
                expect(status).toBe(true);
                done();
            }).catch(error => {
                expect(error).toBe(null);
                done();
            });
        });

        describe("updating share permissions,", function() {
            beforeEach(function(done) {
                oc.shares.updateShare(testFolderShareID, {perms: 31}) // max-permissions
        		.then(status => {
        			expect(status).toBe(null);
        			done();
        		}).catch(error => {
        			var check = 'can\'t change permissions for public share links';
        			if (error === 'can\'t change permission for public link share') {
        				check = 'can\'t change permission for public link share';
        			}
        			expect(error.toLowerCase()).toBe(check);
        			done();
        		});
            });

            it("confirms not changed permissions", function(done) {
                oc.shares.getShare(testFolderShareID).then(share => {
        			// permissions would still be read only as the share is public
        			expect(share.getPermissions()).toEqual(1);
        			done();
        		}).catch(error => {
        			expect(error).toBe(null);
        			done();
        		});
            });
        });

        describe("making publicUpload true,", function() {
            beforeEach(function(done) {
                oc.shares.updateShare(testFolderShareID, {publicUpload: true}).then(data => {
        			expect(data).toBe(true);
        			done();
        		}).catch(error => {
        			expect(error).toBe(null);
        			done();
        		});
            });

            it("confirms publicUpload true", function(done) {
                oc.shares.getShare(testFolderShareID).then(share => {
        			expect(share.getPermissions() & OCS_PERMISSION_CREATE).toBeGreaterThan(0);
        			expect(share.getPermissions() & OCS_PERMISSION_UPDATE).toBeGreaterThan(0);
        			done();
        		}).catch(error => {
        			expect(error).toBe(null);
        			done();
        		});
            });
        });

        describe("adding password,", function() {
            beforeEach(function(done) {
                oc.shares.updateShare(testFolderShareID, {password: 'testPassword'}).then(status => {
        			expect(status).toEqual(true);
        			done();
        		}).catch(error => {
        			expect(error).toBe(null);
        			done();
        		});
            });

            it("confirms added password", function(done) {
                oc.shares.getShare(testFolderShareID).then(share => {
        			expect(typeof(share.getShareWith())).toEqual('string');
        			expect(typeof(share.getShareWithDisplayName())).toEqual('string');
        			done();
        		}).catch(error => {
        			expect(error).toBe(null);
        			done();
        		});
            });
        });
    });
});

describe("Currently testing file sharing,", function () {
	beforeEach(function (done) {
		oc = new ownCloud(owncloudURL);
		oc.login(username, password);

        // CREATING TEST USER
        oc.users.createUser(testUser, testUserPassword).then(status => {
            expect(status).toBe(true);
            // CREATING TEST GROUP
            return oc.groups.createGroup(testGroup);
        }).then(status => {
            expect(status).toBe(true);
            var count = 0;
            for (var i = 0; i < testFiles.length; i++) {
                // CREATING TEST FILES
                oc.files.putFileContents(testFiles[i], testContent).then(status => {
                    expect(status).toBe(true);
                    count++;
                    if (count === testFiles.length) {
                        done();
                    }
                }).catch(error => {
                    expect(error).toBe(null);
                    done();
                });
            }
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
	});

	afterEach(function (done) {
		oc.users.deleteUser(testUser).then(status => {
			expect(status).toBe(true);
			return oc.groups.deleteGroup(testGroup);
		}).then(status2 => {
			expect(status2).toBe(true);

			var count = 0;
            for (var i = 0; i < testFiles.length; i++) {
                // DELETING TEST FILES
                oc.files.delete(testFiles[i]).then(status => {
                    expect(status).toBe(true);
                    count++;
                    if (count === testFiles.length) {
                        done();
                    }
                }).catch(error => {
                    expect(error).toBe(null);
                    done();
                });
            }
		}).catch(error => {
            expect(error).toBe(null);
            done();
        });
	})

    describe("sharedFilesByLink,", function() {
        beforeEach(function(done) {
            var count = 0;
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
                    count++;
                    if (count === testFiles.length) {
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
        });

        afterEach(function(done) {
            var count = 0;
            var numShares = Object.keys(sharedFilesByLink).length;

            for (var file in sharedFilesByLink) {
    			oc.shares.deleteShare(sharedFilesByLink[file]).then(status => {
    				expect(status).toBe(true);
                    count++;
                    if (count === numShares) {
                        sharedFilesByLink = {};
                        done();
                    }
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
        });

        describe("checking the shared files,", function() {
            it('checking method : isShared with shared file', function (done) {
        		var count = 0;

        		for (var i=0;i<testFiles.length;i++) {
        			oc.shares.isShared(testFiles[i]).then(status => {
        				expect(status).toEqual(true);
        				count++;
        				if (count === testFiles.length) {
        					done();
        				}
        			}).catch(error => {
        				expect(error).toBe(null);
        				done();
        			});
        		}
            });

            it('checking method : getShare with existent share', function (done) {
        		var count = 0;

        		for (var file in sharedFilesByLink) {
        			oc.shares.getShare(sharedFilesByLink[file]).then(share => {
        				expect(typeof(share)).toBe('object');
        				expect(sharedFilesWithUser.hasOwnProperty(share.getId())).toBeGreaterThan(-1);
        				count++;
        				if (count === Object.keys(sharedFilesByLink).length) {
        					done();
        				}
        			}).catch(error => {
        				expect(error).toBe(null);
        				done();
        			});
        		}
        	});

            it('checking method : getShares for shared file', function (done) {
        		var count = 0;
    			var allIDs = [];
    			for (var file in sharedFilesByLink) {
    				allIDs.push(sharedFilesByLink[file]);
    			}

        		for (var i=0;i<testFiles.length;i++) {
        			oc.shares.getShares(testFiles[i]).then(shares => {
        				expect(shares.constructor).toBe(Array);
        				var flag = 0;
        				for (var i=0;i<shares.length;i++) {
        					var share = shares[i];
        					if (allIDs.indexOf(share.getId()) > -1) {
        						flag = 1;
        					}
        				}
        				expect(flag).toEqual(1);
        				count++;
        				if (count === testFiles.length) {
        					done();
        				}
        			}).catch(error => {
        				expect(error).toBe(null);
        				done();
        			});
        		}
        	});
        });
    });

    describe("sharedFilesWithUser,", function() {
        beforeEach(function(done) {
            var count = 0;

    		for (var i=0;i<testFiles.length;i++) {
    			oc.shares.shareFileWithUser(testFiles[i], testUser).then(share => {
    				expect(share).not.toBe(null);
    				expect(typeof(share)).toBe('object');
    				expect(typeof(share.getId())).toBe('number');
    				sharedFilesWithUser[share.getPath()] = share.getId();
    				allShareIDs.push(share.getId());
    				count++;
    				if (count === testFiles.length) {
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
        });

        afterEach(function(done) {
            var count = 0;

    		for (var file in sharedFilesWithUser) {
    			oc.shares.deleteShare(sharedFilesWithUser[file]).then(status => {
    				expect(status).toBe(true);
    				count++;
    				if (count === testFiles.length) {
                        sharedFilesWithUser = {};
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
        });

        describe("updating permissions", function() {
            beforeEach(function (done) {
                var maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE;
        		var count = 0;

        		for (var file in sharedFilesWithUser) {
        			oc.shares.updateShare(sharedFilesWithUser[file], {perms: maxPerms}).then(status => {
        				expect(status).toEqual(true);
        				count++;
        				if (count === Object.keys(sharedFilesWithUser).length) {
        					done();
        				}
        			}).catch(error => {
        				expect(error).toBe(null);
        				done();
        			});
        		}
            });

            it ("confirms updated permissions", function (done) {
                var maxPerms = OCS_PERMISSION_READ + OCS_PERMISSION_UPDATE + OCS_PERMISSION_SHARE;
        		var count = 0;

        		for (var file in sharedFilesWithUser) {
        			oc.shares.getShare(sharedFilesWithUser[file]).then(share => {
        				expect(share.getPermissions()).toEqual(maxPerms);
        				count++;
        				if (count === Object.keys(sharedFilesWithUser).length) {
        					done();
        				}
        			}).catch(error => {
        				expect(error).toBe(null);
        				done();
        			});
        		}
            });
        });

        it('checking method : isShared with shared file', function (done) {
    		var count = 0;

    		for (var file in sharedFilesWithUser) {
    			oc.shares.isShared(file).then(status => {
    				expect(status).toEqual(true);
    				count++;
    				if (count === Object.keys(sharedFilesWithUser).length) {
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
        });

        it('checking method : getShare with existent share', function (done) {
    		var count = 0;

    		for (var file in sharedFilesWithUser) {
    			oc.shares.getShare(sharedFilesWithUser[file]).then(share => {
    				expect(typeof(share)).toBe('object');
    				expect(sharedFilesWithUser.hasOwnProperty(share.getId())).toBeGreaterThan(-1);
    				count++;
    				if (count === Object.keys(sharedFilesWithUser).length) {
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
    	});

        it('checking method : getShares for shared file', function (done) {
    		var count = 0;
			var allIDs = [];
			for (var file in sharedFilesWithUser) {
				allIDs.push(sharedFilesWithUser[file]);
			}

    		for (file in sharedFilesWithUser) {
    			oc.shares.getShares(file).then(shares => {
    				expect(shares.constructor).toBe(Array);
    				var flag = 0;
    				for (var i=0;i<shares.length;i++) {
    					var share = shares[i];
    					if (allIDs.indexOf(share.getId()) > -1) {
    						flag = 1;
    					}
    				}
    				expect(flag).toEqual(1);
    				count++;
    				if (count === Object.keys(sharedFilesWithUser).length) {
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
    	});
    });

    describe("sharedFilesWithGroup,", function() {
        beforeEach(function(done) {
            var count = 0;

    		for (var i=0;i<testFiles.length;i++) {
    			oc.shares.shareFileWithGroup(testFiles[i], testGroup, {perms: 19}).then(share => {
    				expect(typeof(share)).toEqual('object');
    				expect(share.getPermissions()).toEqual(19);
                    sharedFilesWithGroup[share.getPath()] = share.getId();
    				allShareIDs.push(share.getId());
    				count++;
    				if (count === testFiles.length) {
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
        });

        afterEach(function(done) {
            var count = 0;

    		for (var file in sharedFilesWithGroup) {
    			oc.shares.deleteShare(sharedFilesWithGroup[file]).then(status => {
    				expect(status).toEqual(true);
    				count++;
    				if (count === testFiles.length) {
                        sharedFilesWithGroup = {};
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
        });

        it('checking method : isShared with shared file', function (done) {
    		var count = 0;

    		for (var file in sharedFilesWithGroup) {
    			oc.shares.isShared(file).then(status => {
    				expect(status).toEqual(true);
    				count++;
    				if (count === Object.keys(sharedFilesWithGroup).length) {
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
        });

        it('checking method : getShare with existent share', function (done) {
    		var count = 0;

    		for (var file in sharedFilesWithGroup) {
    			oc.shares.getShare(sharedFilesWithGroup[file]).then(share => {
    				expect(typeof(share)).toBe('object');
    				expect(sharedFilesWithGroup.hasOwnProperty(share.getId())).toBeGreaterThan(-1);
    				count++;
    				if (count === Object.keys(sharedFilesWithGroup).length) {
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
    	});

        it('checking method : getShares for shared file', function (done) {
    		var count = 0;
			var allIDs = [];
			for (var file in sharedFilesWithGroup) {
				allIDs.push(sharedFilesWithGroup[file]);
			}

    		for (file in sharedFilesWithGroup) {
    			oc.shares.getShares(file).then(shares => {
    				expect(shares.constructor).toBe(Array);
    				var flag = 0;
    				for (var i=0;i<shares.length;i++) {
    					var share = shares[i];
    					if (allIDs.indexOf(share.getId()) > -1) {
    						flag = 1;
    					}
    				}
    				expect(flag).toEqual(1);
    				count++;
    				if (count === Object.keys(sharedFilesWithGroup).length) {
    					done();
    				}
    			}).catch(error => {
    				expect(error).toBe(null);
    				done();
    			});
    		}
    	});
    });

	it('checking method : shareFileWithLink with non-existent file', function (done) {
		oc.shares.shareFileWithLink(nonExistingFile, {password : 'testPassword'}).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	it('checking method : shareFileWithGroup with non existent file', function (done) {
		oc.shares.shareFileWithGroup(nonExistingFile, testGroup, {perms: 19}).then(share => {
			expect(share).toBe(null);
			done();
		}).catch(error => {
			expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist');
			done();
		});
	});

	it('checking method : isShared with non existent file', function (done) {
		oc.shares.isShared(nonExistingFile).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist');
			done();
		});
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

	it('checking method : getShare with non existent share', function (done) {
		oc.shares.getShare(-1).then(share => {
			expect(share).toBe(null);
			done();
		}).catch(error => {
			if (error.slice(-1) === '.') {
				error = error.slice(0, -1);
			}
			expect(error.toLowerCase()).toEqual('wrong share id, share doesn\'t exist');
			done();
		});
	});

	it('checking method : getShares for non existent file', function (done) {
		oc.shares.getShares(nonExistingFile).then(shares => {
			expect(shares).toBe(null);
			done();
		}).catch(error => {
			expect(error.toLowerCase()).toBe('wrong path, file/folder doesn\'t exist');
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

	it('checking method : updateShare for non existent share', function (done) {
		oc.shares.updateShare(-1).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			if (error.slice(-1) === '.') {
				error = error.slice(0, -1);
			}
			expect(error.toLowerCase()).toBe('wrong share id, share doesn\'t exist');
			done();
		});
	});

	it('checking method : deleteShare with non existent share', function (done) {
		oc.shares.deleteShare(-1).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			if (error.slice(-1) === '.') {
				error = error.slice(0, -1);
			}
			expect(error.toLowerCase()).toBe('wrong share id, share doesn\'t exist');
			done();
		});
	});
});

("Currently testing user management,", function () {
	beforeEach(function (done) {
		oc = new ownCloud(owncloudURL);
		oc.login(username, password).then(status => {
			expect(status).toBe(true);
			return oc.users.createUser(testUser, testUserPassword);
		}).then(status2 => {
			expect(status2).toBe(true);
			return oc.groups.createGroup(testGroup);
		}).then(status3 => {
			expect(status3).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	afterEach(function (done) {
		oc.users.deleteUser(testUser).then(status => {
			expect(status).toBe(true);
			return oc.groups.deleteGroup(testGroup);
		}).then(status2 => {
			expect(status2).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	})

	describe("added testUser to testGroup,", function() {
		beforeEach(function(done) {
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

		afterEach(function(done) {
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

		it('checking method : userIsInGroup with an existent user, existent group', function (done) {
			oc.users.userIsInGroup(testUser, testGroup).then(status => {
				expect(status).toBe(true);
				done();
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		});
	});

	describe("made testUser as testGroup subAdmin", function() {
		beforeEach(function(done) {
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
	});

	it('checking method : getUser on an existent user', function (done) {
		oc.users.getUser(username).then(data => {
			expect(typeof(data)).toEqual('object');
			expect(data.displayname).toEqual(username);
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
		oc.users.createUser('newUser' + timeRightNow, testUserPassword).then(data => {
			expect(data).toEqual(true);
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
			expect(data.indexOf(username)).toBeGreaterThan(-1);
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
		oc.users.userExists(username).then(status => {
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
});

describe("Currently testing group management,", function() {
    beforeEach(function(done) {
        oc = new ownCloud(owncloudURL);
        oc.login(username, password).then(status => {
			expect(status).toBe(true);
			return oc.groups.createGroup(testGroup);
		}).then(status2 => {
			expect(status2).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
    });

	afterEach(function(done) {
		oc.groups.deleteGroup(testGroup).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

    it('checking method : getGroups', function(done) {
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

    it('checking method : groupExists with an existing group', function(done) {
        oc.groups.groupExists('admin').then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
    });

    it('checking method : groupExists with a non existing group', function(done) {
        oc.groups.groupExists(nonExistingGroup).then(status => {
            expect(status).toBe(false);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
    });

    it('checking method : getGroupMembers', function(done) {
        oc.groups.getGroupMembers('admin').then(data => {
            expect(typeof(data)).toBe('object');
            expect(data.indexOf(username)).toBeGreaterThan(-1);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
    });

    it('checking method : deleteGroup with a non existing group', function(done) {
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

describe("Currently testing files management,", function () {
	beforeEach(function(done) {
		oc = new ownCloud(owncloudURL);
		oc.login(username, password).then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

    it('creates the testFolder at instance', function(done) {
        oc.files.createFolder(testFolder).then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
    });

    it('creates subfolder at instance', function(done) {
        oc.files.mkdir(testSubDir).then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
    });

    it('creates subfiles at instance', function(done) {
        var count = 0;

        for (var i = 0; i < testSubFiles.length; i++) {
            oc.files.putFileContents(testSubFiles[i], testContent).then(status => {
                expect(status).toBe(true);
                count++;
                if (count === testSubFiles.length) {
                    done();
                }
            }).catch(error => {
                expect(error).toBe(null);
                done();
            });
        }
    });

    it('testFile locally', function(done) {
        fs.writeFile(localFile, testContent, function(err) {
            expect(err).toBe(null);
            done();
        });
    });

	it('checking method : list with no depth specified', function (done) {
		oc.files.list(testFolder).then(files => {
			expect(typeof(files)).toBe('object');
			expect(files.length).toEqual(6);
			expect(files[1].getName()).toEqual('abc.txt');
			expect(files[2].getName()).toEqual('file one.txt');
			expect(files[3].getName()).toEqual('subdir');
			expect(files[4].getName()).toEqual('zz+z.txt');
			expect(files[5].getName()).toEqual('中文.txt');
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : list with Infinity depth', function (done) {
		oc.files.list(testFolder, 'infinity').then(files => {
			expect(typeof(files)).toBe('object');
			expect(files.length).toEqual(7);
			expect(files[3].getName()).toEqual('subdir');
			expect(files[4].getPath()).toEqual(testFolder + '/' + 'subdir/');
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : list with 2 depth', function (done) {
		oc.files.list(testFolder, 2).then(files => {
			expect(typeof(files)).toBe('object');
			expect(files.length).toEqual(7);
			expect(files[3].getName()).toEqual('subdir');
			expect(files[4].getPath()).toEqual(testFolder + '/' + 'subdir/');
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : list with non existent file', function (done) {
		oc.files.list(nonExistingFile).then(files => {
			expect(files).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('File with name ' + nonExistingFile + ' could not be located');
			done();
		});
	});

	it('checking method : getFileContents for existent files', function (done) {
		var count = 0;

		for (var i=0;i<testSubFiles.length;i++) {
			oc.files.getFileContents(testSubFiles[i]).then(content => {
				expect(content).toEqual(testContent);
				count++;
				if (count === testSubFiles.length) {
					done();
				}
			}).catch(error => {
				expect(error).toBe(null);
				done();
			});
		}
	});

	it('checking method : getFileContents for non existent file', function (done) {
		oc.files.getFileContents(nonExistingFile).then(content => {
			expect(content).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('File with name ' + nonExistingFile + ' could not be located');
			done();
		});
	});

	it('checking method : putFileContents for an existing parent path', function (done) {
		var newFile = testFolder + '/' + 'file.txt';

		oc.files.putFileContents(newFile, testContent).then(status => {
			expect(status).toBe(true);
			return oc.files.getFileContents(newFile);
		}).then(content => {
			expect(content).toEqual(testContent);
			return oc.files.delete(newFile);
		}).then(status2 => {
			expect(status2).toEqual(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : putFileContents for a non existing parent path', function (done) {
		oc.files.putFileContents(nonExistingDir + '/' + 'file.txt', testContent).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('File with name ' + nonExistingDir.slice(1) + ' could not be located');
			done();
		});
	});

	it('checking method : mkdir for an existing parent path', function (done) {
		var newFolder = testFolder + '/' + 'new folder/';

		oc.files.mkdir(newFolder).then(status => {
			expect(status).toBe(true);
			return oc.files.list(newFolder, 0);
		}).then(folder => {
			folder = folder[0];
			expect(folder.isDir()).toBe(true);
			expect(folder.getName()).toEqual('new folder');
			return oc.files.delete(newFolder);
		}).then(status2 => {
			expect(status2).toEqual(true);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : mkdir for a non existing parent path', function (done) {
		oc.files.mkdir(nonExistingDir + '/' + 'newFolder/').then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('Parent node does not exist');
			done();
		});
	});

	it('checking method : delete for an existing file', function (done) {
		var newFolder = testFolder + '/' + 'new folder';

		oc.files.mkdir(newFolder).then(status => {
			expect(status).toBe(true);
			return oc.files.list(newFolder, 0);
		}).then(folder => {
			folder = folder[0];
			expect(folder.isDir()).toBe(true);
			expect(folder.getName()).toEqual('new folder');
			return oc.files.delete(newFolder);
		}).then(status2 => {
			expect(status2).toEqual(true);
			return oc.files.list(newFolder, 0);
		}).then(folder2 => {
			expect(folder2).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('File with name ' + newFolder.slice(1) + ' could not be located');
			done();
		});
	});

	it('checking method : delete for a non existing file', function (done) {
		oc.files.delete(nonExistingDir).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('File with name ' + nonExistingDir.slice(1) + ' could not be located');
			done();
		});
	});

	// method : fileInfo is simply calling the method "list", hence no tests needed

	it('checking method : getFile for an existent file', function (done) {
		var file = 'tempFile' + timeRightNow;
		oc.files.putFileContents(file, testContent).then(status => {
			expect(status).toBe(true);
			return oc.files.getFile(file, downloadBasePath + file);
		}).then(status2 => {
			expect(status2).toBe(true);

			fs.readFile(downloadBasePath + file, function (err, data) {
				expect(err).toBe(null);
				expect(data.toString()).toEqual(testContent);

				oc.files.delete(file).then(status3 => {
					expect(status3).toBe(true);
					done();
				}).catch(error2 => {
					expect(error2).toBe(null);
					done();
				});
			});
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getFile for a non existent file', function (done) {
		var file = 'tempFile' + timeRightNow;
		oc.files.getFile(file, downloadBasePath + file).then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('File with name ' + file + ' could not be located');
			done();
		});
	});

	it('checking method : getDirectoryAsZip for an existent folder', function (done) {
		oc.files.getDirectoryAsZip(testFolder, downloadBasePath + timeRightNow +'.zip').then(status => {
			expect(status).toBe(true);

			fs.readFile(downloadBasePath + timeRightNow +'.zip', function(err, data) {
			    JSZip.loadAsync(data).then(function (zip) {
			        var count = Object.keys(zip.files).length;
			        expect(count).toEqual(7);
			        done();
			    });
			});
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : getDirectoryAsZip for a non existent folder', function (done) {
		oc.files.getDirectoryAsZip(testFolder + timeRightNow, downloadBasePath + timeRightNow +'.zip').then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('specified file/folder could not be located');
			done();
		});
	});

	it('checking method : putFile for an existent file', function (done) {
		oc.files.putFile('/', localFile).then(status => {
			expect(status).toBe(true);
			return oc.files.getFileContents('file' + timeRightNow + '.txt');
		}).then(content => {
			expect(content).toEqual(testContent);
            return oc.files.delete('file' + timeRightNow + '.txt');
		}).then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : putFile for a non existent file', function (done) {
		try {
			oc.files.putFile('/', localFile + '123').then(status => {
				expect(status).toBe(null);
				done();
			}).catch(error => {
				expect(error.toString()).toBe(
					'Error: ENOENT: no such file or directory, stat \'' + localFile + '123' + '\''
				);
				done();
			});
		}

		catch(error) {
			expect(error.toString()).toBe(
				'Error: ENOENT: no such file or directory, stat \'' + localFile + '123' + '\''
			);
			done();
		}
	});

	it('checking method : putDirectory for an existent directory', function (done) {
		oc.files.putDirectory(testFolder, downloadBasePath + '/').then(status => {
			expect(status).toBe(true);
			return oc.files.list(testFolder + '/testDownloadDir', 'infinity');
		}).then(files => {
			expect(files.length).toEqual(5);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : putDirectory for a non existent directory', function (done) {
		try {
			oc.files.putDirectory('/', downloadBasePath + '123').then(status => {
				expect(status).toBe(null);
				done();
			}).catch(error => {
				expect(error.toString()).toBe(
					"Error: ENOENT: no such file or directory, scandir '" + downloadBasePath + '123/' + "'"
				);
				done();
			});
		}

		catch(error) {
			expect(error.toString()).toBe(
				"Error: ENOENT: no such file or directory, scandir '" + downloadBasePath + '123/' + "'"
			);
			done();
		}
	});

	it('checking method : move existent file into same folder, same name', function (done) {
		oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe('Source and destination uri are identical.');
			done();
		});
	});

	it('checking method : move existent file into same folder, different name', function (done) {
		oc.files.move(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
			expect(status).toBe(true);
			return oc.files.list(testFolder);
		}).then(files => {
			var fileNames = [];
			for (var i=0;i<files.length;i++) {
				fileNames.push(files[i].getName());
			}
			expect(fileNames.indexOf('中文123.txt')).toBeGreaterThan(-1);
			expect(fileNames.indexOf('中文.txt')).toBe(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : move existent file into different folder', function (done) {
		oc.files.move(testFolder + '/中文123.txt', testFolder + '/中文.txt').then(status => {
			expect(status).toBe(true);
			return oc.files.list(testFolder + '/subdir');
		}).then(files => {
			var fileNames = [];
			for (var i=0;i<files.length;i++) {
				fileNames.push(files[i].getName());
			}
			expect(fileNames.indexOf('中文.txt')).toBe(-1);
			return oc.files.list(testFolder);
		}).then(files2 => {
			var fileNames = [];
			for (var i=0;i<files2.length;i++) {
				fileNames.push(files2[i].getName());
			}
			expect(fileNames.indexOf('中文123.txt')).toBe(-1);
			expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : move non existent file', function (done) {
		oc.files.move(nonExistingFile, '/abcd.txt').then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('File with name ' + nonExistingFile +' could not be located');
			done();
		});
	});

	it('checking method : copy existent file into same folder, same name', function (done) {
		oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
			expect(status).toBe(true);
			done();
		}).catch(error => {
			expect(error).toBe('Source and destination uri are identical.');
			done();
		});
	});

	it('checking method : copy existent file into same folder, different name', function (done) {
		oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文123.txt').then(status => {
			expect(status).toBe(true);
			return oc.files.list(testFolder);
		}).then(files => {
			var fileNames = [];
			for (var i=0;i<files.length;i++) {
				fileNames.push(files[i].getName());
			}
			expect(fileNames.indexOf('中文123.txt')).toBeGreaterThan(-1);
			expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : copy existent file into different folder', function (done) {
		oc.files.copy(testFolder + '/中文123.txt', testFolder + '/subdir/中文.txt').then(status => {
			expect(status).toBe(true);
			return oc.files.list(testFolder + '/subdir');
		}).then(files => {
			var fileNames = [];
			for (var i=0;i<files.length;i++) {
				fileNames.push(files[i].getName());
			}
			expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1);
			return oc.files.list(testFolder);
		}).then(files2 => {
			var fileNames = [];
			for (var i=0;i<files2.length;i++) {
				fileNames.push(files2[i].getName());
			}
			expect(fileNames.indexOf('中文123.txt')).toBeGreaterThan(-1);
			expect(fileNames.indexOf('中文.txt')).toBeGreaterThan(-1);
			done();
		}).catch(error => {
			expect(error).toBe(null);
			done();
		});
	});

	it('checking method : copy non existent file', function (done) {
		oc.files.copy(nonExistingFile, '/abcd.txt').then(status => {
			expect(status).toBe(null);
			done();
		}).catch(error => {
			expect(error).toBe('File with name ' + nonExistingFile +' could not be located');
			done();
		});
	});

    it('deletes the test folder at instance', function (done) {
        oc.files.delete(testFolder).then(status => {
            expect(status).toBe(true);
            done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
    });
});
