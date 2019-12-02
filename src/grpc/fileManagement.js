const { StatRequest } = require('cs3apis/cs3/storageprovider/v0alpha/storageprovider_pb.js')
const { Reference } = require('cs3apis/cs3/storageprovider/v0alpha/resources_pb.js')
const Converter = require('./converter')
/**
 * @class Files
 * @classdesc
 * <b><i> The Files class, has all the methods for your ownCloud files management.</i></b><br><br>
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
 *          <li>File</li>
 *          <li>getDirectoryAsZip</li>
 *          <li>putFile</li>
 *          <li>putDirectory</li>
 *          <li>move</li>
 *          <li>copy</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Diogo Castro
 * @version 1.0.0
 * @param   {Reva}    reva  instance of the Reva client/configuration class
 */
class Files {
  constructor (reva) {
    this.reva = reva
  }

  /**
   * Returns the listing/contents of the given remote directory
   * First entry is the current directory (TODO should we change this?)
   * @param   {string}    path          path of the file/folder at OC instance
   * @returns {Promise.<File>}      Array[objects]: each object is an instance of class File
   * @returns {Promise.<error>}         string: error message, if any.
   */
  async list (path) {
    let revaClient = await this.reva.getClient()

    let ref = new Reference()
    ref.setPath('/' + path) // TODO fix this?

    let req = new StatRequest()
    req.setRef(ref)

    let currentDirectory
    await revaClient.stat(req, (response) => {
      currentDirectory = response.getInfo()
    })

    return revaClient.listContainer(req, (response) => {
      let files = []
      // Add the current directory since webdav returns it
      // and phoenix requires it... TODO should this be separate?
      files.push(Converter.getFile(currentDirectory))

      response.getInfosList().forEach(resourceInfo => {
        files.push(Converter.getFile(resourceInfo))
      })
      return files
    })
  }

  async getFileUrl (path) {

  }

  async getPathForFileId (fileId) {

  }

  async putFileContents (path, content, options = {}) {

  }

  async createFolder (path) {

  }
}
module.exports = Files
