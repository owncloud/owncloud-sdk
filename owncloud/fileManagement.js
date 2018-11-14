//////////////////////////////////////
///////    FILES MANAGEMENT    ///////
//////////////////////////////////////

var Promise = require('promise');
var helpers;

/**
 * @class files
 * @classdesc
 * <b><i> The files class, has all the methods for your owncloud files management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *  <li><b>Files Management</b>
 *      <ul>
 *          <li>list</li>
 *          <li>getFileContents</li>
 *          <li>putFileContents</li>
 *          <li>mkdir</li>
 *          <li>createFolder</li>
 *          <li>delete</li>
 *          <li>fileInfo</li>
 *          <li>getFile</li>
 *          <li>getDirectoryAsZip</li>
 *          <li>putFile</li>
 *          <li>putDirectory</li>
 *          <li>move</li>
 *          <li>copy</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param   {object}    helperFile  instance of the helpers class
 */
function files(helperFile) {
    helpers = helperFile;
}

/**
 * Returns the listing/contents of the given remote directory
 * @param   {string}    remotePath    path of the file/folder at OC instance
 * @param   {string}    depth         0: only file/folder, 1: upto 1 depth, infinity: infinite depth
 * @returns {Promise.<fileInfo>}      Array[objects]: each object is an instance of class fileInfo
 * @returns {Promise.<error>}         string: error message, if any.
 */
files.prototype.list = function(path, depth) {
    if (path[path.length - 1] !== '/') {
        path += '/';
    }

    var headersToSend = {};
    if (!isNaN((parseInt(depth))) || depth === "infinity") {
        depth = depth.toString();
        headersToSend.depth = depth;
    }

    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('PROPFIND', path, headersToSend).then(files => {
            resolve(files);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Returns the contents of a remote file
 * @param   {string}  remotePath    path of the remote file at OC instance
 * @returns {Promise.<contents>}    string: contents of file
 * @returns {Promise.<error>}       string: error message, if any.
 */
files.prototype.getFileContents = function(path) {
    path = helpers._encodeUri(path);


    return new Promise((resolve, reject) => {
        helpers._get(helpers._webdavUrl + path).then(data => {
            var response = data.response;
            var body = data.body;

            if (response.statusCode === 200) {
                resolve(body);
            } else {
                var err = helpers._parseDAVerror(body);
                reject(err);
            }
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Write data into a remote file
 * @param   {string} remotePath path of the file at OC instance
 * @param   {string} content    content to be put
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.putFileContents = function(path, content) {
    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('PUT', path, null, content).then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Creates a remote directory
 * @param   {string} remotePath path of the folder to be created at OC instance
 * @returns {Promise.<status>}  boolean: wether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.mkdir = function(path) {
    if (path[path.length - 1] !== '/') {
        path += '/';
    }

    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('MKCOL', path).then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Creates a remote directory
 * @param   {string}  remotePath  path of the folder to be created at OC instance
 * @returns {Promise.<status>}    boolean: wether the operation was successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
files.prototype.createFolder = function(path) {
    if (path[path.length - 1] !== '/') {
        path += '/';
    }

    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('MKCOL', path).then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Deletes a remote file or directory
 * @param   {string}  remotePath  path of the file/folder at OC instance
 * @returns {Promise.<status>}    boolean: wether the operation was successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
files.prototype.delete = function(path) {
    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('DELETE', path).then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Returns the file info for the given remote file
 * @param   {string}  remotePath    path of the file/folder at OC instance
 * @returns {Promise.<fileInfo>}    object: instance of class fileInfo
 * @returns {Promise.<error>}       string: error message, if any.
 */
files.prototype.fileInfo = function(path) {
    return new Promise((resolve, reject) => {
        this.list(path, 0).then(fileInfo => {
            resolve(fileInfo[0]);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Helper for putDirectory
 * This function first makes all the directories required
 * @param  {object}     array    file list (ls -R) of the directory to be put
 * @return {Promise.<status>}    boolean: wether mkdir was successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
files.prototype.recursiveMkdir = function(array) {
    /* jshint unused : false */
    var self = this;
    return new Promise(function(resolve, reject) {
        self.mkdir(array[0].path).then(status => {
            array.shift();
            if (array.length === 0) {
                resolve(true);
                return;
            }
            self.recursiveMkdir(array).then(status2 => {
                resolve(true);
            }).catch(err => {
                reject(err);
            });
        }).catch(error => {
            reject(error);
        });
    });
    /* jshint unused : true */
};

/**
 * Moves a remote file or directory
 * @param   {string} source     initial path of file/folder
 * @param   {string} target     path where to move file/folder finally
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.move = function(source, target) {
    return new Promise((resolve, reject) => {
        helpers._webdavMoveCopy(source, target, 'MOVE').then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Copies a remote file or directory
 * @param   {string} source     initial path of file/folder
 * @param   {string} target     path where to copy file/folder finally
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.copy = function(source, target) {
    return new Promise((resolve, reject) => {
        helpers._webdavMoveCopy(source, target, 'COPY').then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

module.exports = files;
