const File = require('../types/file')
const Permissions = require('../types/permissions')
const User = require('../types/user')
const { ResourceType } = require('cs3apis/cs3/storageprovider/v0alpha/resources_pb.js')

class Converter {
  static getFile (resourseInfo) {
    let file = new File()
    file.id = resourseInfo.getId().getStorageId()
    file.fullPath = resourseInfo.getPath().replace('//', '/')
    file.size = resourseInfo.getSize()
    file.eTag = resourseInfo.getEtag()
    file.lastModified = resourseInfo.getMtime().getNanos()
    file.type = resourseInfo.getType() === ResourceType.RESOURCE_TYPE_CONTAINER ? 'dir' : 'file'
    file.mimeType = resourseInfo.getMimeType()
    // file.metadata = resourseInfo.getArbitraryMetadata()
    let permissions = new Permissions('WCKDNVR', file.type) // TODO build permissions from resourseInfo.getPermissionSet()
    file.permissions = permissions

    let user = new User('', '')
    file.owner = user

    return file
  }
}

module.exports = Converter
