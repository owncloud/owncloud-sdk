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

shareInfo.prototype.getId = function() {
	return this._getInt('id');
};

shareInfo.prototype.getShareType = function() {
	return this._getInt('shareType');
};

shareInfo.prototype.getShareWith = function() {
	if ('shareWith' in this.shareInfo) {
		return this.shareInfo['shareWith'];
	}
	return null;
};

shareInfo.prototype.getShareWithDisplayName = function() {
	if ('shareWithDisplayName' in this.shareInfo) {
		return this.shareInfo['shareWithDisplayName'];
	}
	return null;
};

shareInfo.prototype.getPath = function() {
	if ('path' in this.shareInfo) {
		return this.shareInfo['path'];
	}
	return null;
};

shareInfo.prototype.getPermissions = function() {
	return this._getInt('permissions');
};

shareInfo.prototype.getShareTime = function() {
	return datetime.datetime.fromtimestamp(
    	this._getInt('stime')
    );
};

shareInfo.prototype.getExpiration = function() {
	var exp = this._getInt('expiration')
    if (exp) {
		return datetime.datetime.fromtimestamp(
		    exp
		);
	}
    return null;
};

shareInfo.prototype.getToken = function() {
	if ('token' in this.shareInfo) {
        return this.shareInfo['token']
    }
	return null;
}

shareInfo.prototype.getLink = function() {
	if ('url' in this.shareInfo) {
		return this.shareInfo['url'];
	}
	return null;
};

shareInfo.prototype.getUidOwner = function () {
    if ('uidOwner' in this.shareInfo) {
        return this.shareInfo['uidOwner'];
    }
    return null;
}

shareInfo.prototype.getDisplaynameOwner = function () {
    if ('displaynameOwner' in this.shareInfo) {
        return this.shareInfo['displaynameOwner'];
    }
    return null;
}

shareInfo.prototype._getInt = function(key) {
	return parseInt(this.shareInfo[key]);
};

module.exports = shareInfo;