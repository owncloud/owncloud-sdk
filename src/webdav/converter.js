const File = require('../types/file')
const Permissions = require('../types/permissions')
const User = require('../types/user')

class Converter {
  static getFile (path, props) {
    let file = new File()

    file.id = props['{http://owncloud.org/ns}fileid'] || null
    file.fullPath = path
    file.eTag = props['{DAV:}getetag'] || null
    file.lastModified = props['{DAV:}getlastmodified'] || null

    let fileType = 'file'
    const resType = props['{DAV:}resourcetype']
    if (resType) {
      const xmlvalue = resType[0]
      if (xmlvalue.namespaceURI === 'DAV:' && xmlvalue.nodeName.split(':')[1] === 'collection') {
        fileType = 'dir'
      }
    }
    file.type = fileType

    if (file.isDir) {
      file.mimeType = 'httpd/unix-directory'
      file.size = props['{http://owncloud.org/ns}size'] || null
    } else {
      file.mimeType = props['{DAV:}getcontenttype'] || null
      file.size = props['{DAV:}getcontentlength'] || null
    }

    let permissions = new Permissions(props['{http://owncloud.org/ns}permissions'] || '', file.type)
    file.permissions = permissions
    // file.metadata = props['{http://owncloud.org/ns}favorite'] // TODO add favourite in metadata like in grpc

    let user = new User(props['{http://owncloud.org/ns}owner-id'] || '', props['{http://owncloud.org/ns}owner-display-name'] || '')
    file.owner = user

    return file
  }
}

module.exports = Converter
