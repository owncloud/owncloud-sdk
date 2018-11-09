//////////////////////////////////////
///////    FILES MANAGEMENT    ///////
//////////////////////////////////////

var Promise = require('promise');
var dav = require('davclient.js');
var fileInfo = require('./fileInfo.js');
var helpers;
var davClient;

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
 * @param   {helpers}    helperFile  instance of the helpers class
 */
function files(helperFile) {
    helpers = helperFile;
    davClient = new dav.Client({
        baseUrl : helpers._webdavUrl
    });
}

/**
 * Returns the listing/contents of the given remote directory
 * @param   {string}    path          path of the file/folder at OC instance
 * @param   {string}    depth         0: only file/folder, 1: upto 1 depth, infinity: infinite depth
 * @returns {Promise.<fileInfo>}      Array[objects]: each object is an instance of class fileInfo
 * @returns {Promise.<error>}         string: error message, if any.
 */
files.prototype.list = function(path, depth) {
    if (path[path.length - 1] !== '/') {
        path += '/';
    }

    if(typeof depth === "undefined") {
        depth = 1;
    }

    return new Promise((resolve, reject) => {
        davClient.propFind(helpers._buildFullWebDAVPath(path), [], depth, {
            'Authorization': helpers.getAuthorization()
        }).then(result => {
            if (result.status !== 207) {
                resolve(null);
            } else {
                // TODO: convert body into file objects as expected
                resolve(this._parseBody(result.body));
            }
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Returns the contents of a remote file
 * @param   {string}  path          path of the remote file at OC instance
 * @returns {Promise.<contents>}    string: contents of file
 * @returns {Promise.<error>}       string: error message, if any.
 */
files.prototype.getFileContents = function(path) {
    return new Promise((resolve, reject) => {
        // TODO: use davclient ?
        helpers._get(helpers._buildFullWebDAVPath(path)).then(data => {
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
 * @param   {string} path       path of the file at OC instance
 * @param   {string} content    content to be put
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.putFileContents = function(path, content) {
    return new Promise((resolve, reject) => {
        if (!helpers.getAuthorization()) {
            reject("Please specify an authorization first.");
            return;
        }

        davClient.request('PUT', helpers._buildFullWebDAVPath(path), {
            'Authorization': helpers.getAuthorization()
        }, content).then(result => {
            if ([200, 201, 204, 207].indexOf(result.status) > -1) {
                resolve(true);
            } else {
                reject(helpers._parseDAVerror(result.body));
            }
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Creates a remote directory
 * @param   {string} path       path of the folder to be created at OC instance
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.mkdir = function(path) {
    if (path[path.length - 1] !== '/') {
        path += '/';
    }

    return new Promise((resolve, reject) => {
        if (!helpers.getAuthorization()) {
            reject("Please specify an authorization first.");
            return;
        }

        davClient.request('MKCOL', helpers._buildFullWebDAVPath(path), {
            'Authorization': helpers.getAuthorization()
        }).then(result => {
            if ([200, 201, 204, 207].indexOf(result.status) > -1) {
                resolve(true);
            } else {
                reject(helpers._parseDAVerror(result.body));
            }
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Creates a remote directory
 * @param   {string}  path        path of the folder to be created at OC instance
 * @returns {Promise.<status>}    boolean: wether the operation was successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
files.prototype.createFolder = function(path) {
    return this.mkdir(path);
};

/**
 * Deletes a remote file or directory
 * @param   {string}  remotePath  path of the file/folder at OC instance
 * @returns {Promise.<status>}    boolean: wether the operation was successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
files.prototype.delete = function(path) {
    return new Promise((resolve, reject) => {
        if (!helpers.getAuthorization()) {
            reject("Please specify an authorization first.");
            return;
        }

        davClient.request('DELETE', helpers._buildFullWebDAVPath(path), {
            'Authorization': helpers.getAuthorization()
        }).then(result => {
            if ([200, 201, 204, 207].indexOf(result.status) > -1) {
                resolve(true);
            } else {
                reject(helpers._parseDAVerror(result.body));
            }
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Returns the file info for the given remote file
 * @param   {string}  path          path of the file/folder at OC instance
 * @returns {Promise.<fileInfo>}    object: instance of class fileInfo
 * @returns {Promise.<error>}       string: error message, if any.
 */
files.prototype.fileInfo = function(path) {
    return new Promise((resolve, reject) => {
        this.list(path, "0").then(fileInfo => {
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
        if (!helpers.getAuthorization()) {
            reject("Please specify an authorization first.");
            return;
        }

        davClient.request('MOVE', helpers._buildFullWebDAVPath(source), {
            'Authorization': helpers.getAuthorization(),
            'Destination': helpers._buildFullWebDAVPath(target)
        }).then(result => {
            if ([200, 201, 204, 207].indexOf(result.status) > -1) {
                resolve(true);
            } else {
                reject(helpers._parseDAVerror(result.body));
            }
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
        if (!helpers.getAuthorization()) {
            reject("Please specify an authorization first.");
            return;
        }

        davClient.request('COPY', helpers._buildFullWebDAVPath(source), {
            'Authorization': helpers.getAuthorization(),
            'Destination': helpers._buildFullWebDAVPath(target)
        }).then(result => {
            if ([200, 201, 204, 207].indexOf(result.status) > -1) {
                resolve(true);
            } else {
                reject(helpers._parseDAVerror(result.body));
            }
        }).catch(error => {
            reject(error);
        });
    });
};

files.prototype._parseBody = function(responses) {
    if (!Array.isArray(responses)) {
        responses = [responses];
    }
    var self = this;
    var fileInfos = [];
    for (var i = 0; i < responses.length; i++) {
        var fileInfo = self._parseFileInfo(responses[i]);
        if (fileInfo !== null) {
            fileInfos.push(fileInfo);
        }
    }
    return fileInfos;

};

files.prototype._extractPath = function(path) {
    var pathSections = path.split('/');
    pathSections = pathSections.filter(function(section) { return section !== ''});

    let _rootSections = ['remote.php', 'webdav'];

    var i = 0;
    for (i = 0; i < _rootSections.length; i++) {
        if (_rootSections[i] !== decodeURIComponent(pathSections[i])) {
            // mismatch
            return null;
        }
    }

    // build the sub-path from the remaining sections
    var subPath = '';
    while (i < pathSections.length) {
        subPath += '/' + decodeURIComponent(pathSections[i]);
        i++;
    }
    return subPath;
};

files.prototype._parseFileInfo = function(response) {
    var path = this._extractPath(response.href);
    // invalid subpath
    if (path === null) {
        return null;
    }
    let name = path;

    if (response.propStat.length === 0 || response.propStat[0].status !== 'HTTP/1.1 200 OK') {
        return null;
    }

    var props = response.propStat[0].properties;
    let fileType = 'file';
    var resType = props['{DAV:}resourcetype'];
    if (resType) {
        var xmlvalue = resType[0];
        if (xmlvalue.namespaceURI === 'DAV:' && xmlvalue.nodeName.split(':')[1] === 'collection') {
            fileType = 'dir';
        }
    }

    return new fileInfo(name, fileType, props);
};

module.exports = files;
