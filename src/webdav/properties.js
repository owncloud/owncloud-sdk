let WebdavProperties = {
  BasicFileProperties: [
    '{http://owncloud.org/ns}permissions',
    '{http://owncloud.org/ns}favorite',
    '{http://owncloud.org/ns}fileid',
    '{http://owncloud.org/ns}owner-id',
    '{http://owncloud.org/ns}owner-display-name',
    '{http://owncloud.org/ns}privatelink',
    '{DAV:}getcontentlength',
    '{http://owncloud.org/ns}size',
    '{DAV:}getlastmodified',
    '{DAV:}getetag',
    '{DAV:}resourcetype'
  ],
  PublicLinkProperties: [
    '{http://owncloud.org/ns}public-link-item-type',
    '{http://owncloud.org/ns}public-link-permission',
    '{http://owncloud.org/ns}public-link-expiration',
    '{http://owncloud.org/ns}public-link-share-datetime',
    '{http://owncloud.org/ns}public-link-share-owner'
  ],
  TrashProperties: [
    '{http://owncloud.org/ns}trashbin-original-filename',
    '{http://owncloud.org/ns}trashbin-original-location',
    '{http://owncloud.org/ns}trashbin-delete-datetime',
    '{DAV:}getcontentlength',
    '{DAV:}resourcetype'
  ]
}

module.exports = WebdavProperties
