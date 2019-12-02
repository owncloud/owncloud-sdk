// TODO understand where this is necessary
// const { ResourceInfo } = require('cs3apis/cs3/storageprovider/v0alpha/resources_pb.js')
// const File = require('./file')

// class FileShared extends File {
//   constructor () {
//     super(arguments)

//     if (arguments[0] instanceof ResourceInfo) {
//       this.owner = arguments[0].getOwner()
//     } else {
//       this.owner = arguments[2]['{http://owncloud.org/ns}public-link-share-owner'] || null
//       this.shareTime = arguments[2]['{http://owncloud.org/ns}public-link-share-datetime'] || null
//     }
//   }

//   getOwner () {
//     return this.owner
//   }

//   getShareTime () {
//     return this.shareTime
//   }
// }

// module.export = FileShared
