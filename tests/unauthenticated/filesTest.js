////////////////////////////////
///////    MAIN TESTS    ///////
////////////////////////////////

/* globals ownCloud, __karma__ */

describe("Currently testing files management,", function () {
// CURRENT TIME
    var timeRightNow = new Date().getTime();

// LIBRARY INSTANCE
    var oc;


// TESTING CONFIGS
    var testContent = 'testContent';
    var testFolder = '/testFolder' + timeRightNow;
    var testSubFiles	 = [
        testFolder + '/' + 'file one.txt',
        testFolder + '/' + 'zz+z.txt',
        testFolder + '/' + '中文.txt',
        testFolder + '/' + 'abc.txt',
        testFolder + '/' + 'subdir/in dir.txt'
    ];

    var config = __karma__.config.ownCloudConfig;
    var owncloudURL = config.owncloudURL;

    beforeEach(function() {
        oc = new ownCloud(owncloudURL);
    });

    it('checking method : list', function(done) {
        oc.files.list(testFolder, 1).then(files => {
            expect(files).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe('Please specify an authorization first.');
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
                expect(error).toBe('Please specify an authorization first.');
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
            expect(error).toBe('Please specify an authorization first.');
            done();
        });
    });

    it('checking method : mkdir', function(done) {
        var newFolder = testFolder + '/' + 'new folder/';

        oc.files.mkdir(newFolder).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe('Please specify an authorization first.');
            done();
        });
    });

    it('checking method : delete', function(done) {
        var newFolder = testFolder + '/' + 'new folder';

        oc.files.mkdir(newFolder).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe('Please specify an authorization first.');
            done();
        });
    });

    it('checking method : getFile', function(done) {
        var file = 'tempFile' + timeRightNow;

        oc.files.putFileContents(file, testContent).then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe('Please specify an authorization first.');
            done();
        });
    });

    it('checking method : move', function(done) {
        oc.files.move(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe('Please specify an authorization first.');
            done();
        });
    });

    it('checking method : copy', function(done) {
        oc.files.copy(testFolder + '/中文.txt', testFolder + '/中文.txt').then(status => {
            expect(status).toBe(null);
            done();
        }).catch(error => {
            expect(error).toBe('Please specify an authorization first.');
            done();
        });
    });
});
