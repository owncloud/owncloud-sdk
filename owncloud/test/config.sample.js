// unique id to use for testing
var testId = new Date().getTime();

var config = {
    // Change this to your ownCloud's URL
    'owncloudURL': 'noveen.tk/testInstance/core',
    // ownCloud login
    'username': 'testUser',
    // ownCloud password
    'password': 'testPassword',
    // test user whom we want to share a file
    'owncloudShare2user': 'owncloud',
    // test group, uses to add owncloud_share2user to it etc
    'testGroup': 'testGroup',
    // remote root path to use for testing
    'testRoot': 'someRoot' + testId,
    // app name to use when testing privatedata API
    'appName': 'someAppName' + testId,
    //groups to be created
    'groupsToCreate': ["group1","group2","group3"],
    //not existing group
    'notExistingGroup': 'someRandomGroupNameWhichDoesntExist'
};

module.exports = config;