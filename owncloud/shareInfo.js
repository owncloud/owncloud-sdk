/**
 * @class
 * @classdesc shareInfo class, stores information regarding a share
 * @param {object} containing information like id, url etc. of the share
 */
function shareInfo(shareInfo) {
	this.shareInfo = {};

	// Below keys don't need to be stored
    notNeededKeys = ['item_type', 'item_source', 'file_source', 'parent', 'storage', 'mail_send'];

    for (key in shareInfo) {
        if (!(key in notNeededKeys)) {
            this.shareInfo[key] = shareInfo[key];
        }
    }
    this.shareId = this._getInt('id');
    if ('token' in this.shareInfo) {
        this.token = this.shareInfo['token']
    }
}

/**
 * Gets the ID of share
 * @returns {Number} ID of share
 */
shareInfo.prototype.getId = function() {
	return this._getInt('id');
};

/**
 * Gets share type of share
 * @returns {Number} Share type of share
 */
shareInfo.prototype.getShareType = function() {
	return this._getInt('share_type');
};

/**
 * Gets shareWith of the share
 * @returns {string} shareWith of share
 */
shareInfo.prototype.getShareWith = function() {
	if ('shareWith' in this.shareInfo) {
		return this.shareInfo['share_with'];
	}
	return null;
};

/**
 * Gets display name of share
 * @returns {string} display name of share
 */
shareInfo.prototype.getShareWithDisplayName = function() {
	if ('share_with_displayname' in this.shareInfo) {
		return this.shareInfo['share_with_displayname'];
	}
	return null;
};

/**
 * Gets path of share
 * @returns {string} Path of share
 */
shareInfo.prototype.getPath = function() {
	if ('path' in this.shareInfo) {
		return this.shareInfo['path'];
	}
	return null;
};

/**
 * Gets permissions of share
 * @returns {string} permissions of share
 */
shareInfo.prototype.getPermissions = function() {
	return this._getInt('permissions');
};

/**
 * Gets share time of share
 * @returns {Number} Share time of share
 */
shareInfo.prototype.getShareTime = function() {
	return datetime.datetime.fromtimestamp(
    	this._getInt('stime')
    );
};

/**
 * Gets expiration time of share
 * @returns {Number} Expiration time of share
 */
shareInfo.prototype.getExpiration = function() {
	var exp = this._getInt('expiration')
    if (exp) {
		return datetime.datetime.fromtimestamp(
		    exp
		);
	}
    return null;
};

/**
 * Gets token of share
 * @returns {string} token of share
 */
shareInfo.prototype.getToken = function() {
	if ('token' in this.shareInfo) {
        return this.shareInfo['token']
    }
	return null;
}

/**
 * Gets link of share
 * @returns {string} Link of share
 */
shareInfo.prototype.getLink = function() {
	if ('url' in this.shareInfo) {
		return this.shareInfo['url'];
	}
	return null;
};

/**
 * Gets UID owner of share
 * @returns {string} UID owner of share
 */
shareInfo.prototype.getUidOwner = function () {
    if ('uid_file_owner' in this.shareInfo) {
        return this.shareInfo['uid_file_owner'];
    }
    return null;
}

/**
 * Gets name of owner of share
 * @returns {string} name of owner of share
 */
shareInfo.prototype.getDisplaynameOwner = function () {
    if ('displayname_file_owner' in this.shareInfo) {
        return this.shareInfo['displayname_file_owner'];
    }
    return null;
}

/**
 * Typecasts to integer
 * @param {string} [key] Corresponding key element to be typecasted to an integer
 * @returns {Number} typcasted integer
 */
shareInfo.prototype._getInt = function(key) {
	return parseInt(this.shareInfo[key]);
};

module.exports = shareInfo;