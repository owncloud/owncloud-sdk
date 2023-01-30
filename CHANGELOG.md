# Changelog for [unreleased] (UNRELEASED)

The following sections list the changes in ownCloud SDK unreleased.

[unreleased]: https://github.com/owncloud/owncloud-sdk/compare/v3.0.0...master

## Summary

* Bugfix - Allow removing expiration dates from space shares: [#1204](https://github.com/owncloud/owncloud-sdk/pull/1204)
* Enhancement - Resource processing: [#1109](https://github.com/owncloud/owncloud-sdk/pull/1109)
* Enhancement - Share space with group: [#1207](https://github.com/owncloud/owncloud-sdk/pull/1207)

## Details

* Bugfix - Allow removing expiration dates from space shares: [#1204](https://github.com/owncloud/owncloud-sdk/pull/1204)

   We've fixed a bug where removing expiration dates from space shares was not possible.

   https://github.com/owncloud/owncloud-sdk/pull/1204
   https://github.com/owncloud/web/pull/8320


* Enhancement - Resource processing: [#1109](https://github.com/owncloud/owncloud-sdk/pull/1109)

   We've added a processing property to the fileinfo if the server response is `HTTP/1.1 425 TOO
   EARLY`

   https://github.com/owncloud/owncloud-sdk/pull/1109
   https://github.com/owncloud/owncloud-sdk/pull/1188


* Enhancement - Share space with group: [#1207](https://github.com/owncloud/owncloud-sdk/pull/1207)

   We've added a helper to share a space with a group.

   https://github.com/owncloud/owncloud-sdk/pull/1207

# Changelog for [3.0.0] (2022-11-28)

The following sections list the changes in ownCloud SDK 3.0.0.

[3.0.0]: https://github.com/owncloud/owncloud-sdk/compare/v2.0.1...v3.0.0

## Summary

* Bugfix - Always add X-Request-ID: [#1016](https://github.com/owncloud/owncloud-sdk/pull/1016)
* Bugfix - Always add X-Requested-With header: [#1020](https://github.com/owncloud/owncloud-sdk/pull/1020)
* Bugfix - Optional no cache for public links: [#1079](https://github.com/owncloud/owncloud-sdk/pull/1079)
* Bugfix - Depth 0 PROPFIND on empty responses: [#1128](https://github.com/owncloud/owncloud-sdk/pull/1128)
* Change - Pass full trash bin path to methods of FilesTrash class: [#1021](https://github.com/owncloud/owncloud-sdk/pull/1021)
* Enhancement - Adjust share management to properly work with spaces: [#1013](https://github.com/owncloud/owncloud-sdk/pull/1013)
* Enhancement - Add blob resolveType: [#1028](https://github.com/owncloud/owncloud-sdk/pull/1028)
* Enhancement - Replace deprecated String.prototype.substr(): [#1035](https://github.com/owncloud/owncloud-sdk/pull/1035)
* Enhancement - Create quicklink: [#1041](https://github.com/owncloud/owncloud-sdk/pull/1041)
* Enhancement - Enforce `share_type` guest if applies: [#1046](https://github.com/owncloud/owncloud-sdk/pull/1046)
* Enhancement - Enable search results for ocis: [#1057](https://github.com/owncloud/owncloud-sdk/pull/1057)
* Enhancement - Send oc-etag on putFileContents and getFileContents methods: [#1067](https://github.com/owncloud/owncloud-sdk/pull/1067)
* Enhancement - Add overwrite flag for file move: [#1073](https://github.com/owncloud/owncloud-sdk/pull/1073)
* Enhancement - Add overwrite flag for file copy: [#1087](https://github.com/owncloud/owncloud-sdk/pull/1087)
* Enhancement - Add role api parameter and stop deleting other params: [#1092](https://github.com/owncloud/owncloud-sdk/pull/1092)
* Enhancement - Add range to search result: [#1112](https://github.com/owncloud/owncloud-sdk/pull/1112)
* Enhancement - Add token info endpoint support: [#1126](https://github.com/owncloud/owncloud-sdk/pull/1126)
* Enhancement - Add overwrite flag for public files move and copy: [#7122](https://github.com/owncloud/web/issues/7122)

## Details

* Bugfix - Always add X-Request-ID: [#1016](https://github.com/owncloud/owncloud-sdk/pull/1016)

   We've removed a version check that omitted the `X-Request-ID` header value in request headers
   when the backend version was below v10.1.0. Since ownCloud Infinite Scale follows it's own
   versioning this caused oCIS not having the X-Request-ID in any request if below this version,
   hence preventing us from announcing the correct version for oCIS.

   https://github.com/owncloud/owncloud-sdk/pull/1016
   https://github.com/owncloud/ocis/pull/2918


* Bugfix - Always add X-Requested-With header: [#1020](https://github.com/owncloud/owncloud-sdk/pull/1020)

   We've added the `X-Requested-With` header to all requests as oC 10 is using this to determine
   whether it should treat certain requests as ajax requests or not (for example: ajax requests
   should never show an auth popup).

   https://github.com/owncloud/owncloud-sdk/pull/1020


* Bugfix - Optional no cache for public links: [#1079](https://github.com/owncloud/owncloud-sdk/pull/1079)

   Adds a new `noCache` option to the public links' `download` method, which sets the
   `Cache-Control: no-cache` header.

   https://github.com/owncloud/owncloud-sdk/pull/1079


* Bugfix - Depth 0 PROPFIND on empty responses: [#1128](https://github.com/owncloud/owncloud-sdk/pull/1128)

   We fixed a bug where depth 0 PROPFINDs resulted in an exception when the response is empty. This
   was happening when requesting only certain props in the PROPFIND and those were not present.

   https://github.com/owncloud/owncloud-sdk/pull/1128


* Change - Pass full trash bin path to methods of FilesTrash class: [#1021](https://github.com/owncloud/owncloud-sdk/pull/1021)

   Since incompatibility with spaces, we changed the way how the methods of the class
   FilesTrash(filesTrash.js) need to be called. Now it is mandatory to pass the full webDav(v2)
   path of the trash bin.

   https://github.com/owncloud/owncloud-sdk/pull/1021


* Enhancement - Adjust share management to properly work with spaces: [#1013](https://github.com/owncloud/owncloud-sdk/pull/1013)

   This includes the following changes:

   * Added a new method `shareSpaceWithUser` * Added the possibility to pass URL params to the
   `deleteShare` method * Added a new `space_ref` param when fetching or adding new shares

   https://github.com/owncloud/owncloud-sdk/pull/1013
   https://github.com/owncloud/owncloud-sdk/pull/1025
   https://github.com/owncloud/owncloud-sdk/pull/1027


* Enhancement - Add blob resolveType: [#1028](https://github.com/owncloud/owncloud-sdk/pull/1028)

   We now support blob as resolveType for requests in addition to text and arrayBuffer.

   https://github.com/owncloud/owncloud-sdk/pull/1028


* Enhancement - Replace deprecated String.prototype.substr(): [#1035](https://github.com/owncloud/owncloud-sdk/pull/1035)

   We've replaced all occurrences of the deprecated String.prototype.substr() function with
   String.prototype.slice() which works similarly but isn't deprecated.

   https://github.com/owncloud/owncloud-sdk/pull/1035


* Enhancement - Create quicklink: [#1041](https://github.com/owncloud/owncloud-sdk/pull/1041)

   We've added the option to define if a share link is of type quicklink or not.

   https://github.com/owncloud/web/issues/6605
   https://github.com/owncloud/owncloud-sdk/pull/1041
   https://github.com/owncloud/core/pull/39167
   https://github.com/cs3org/reva/pull/2715


* Enhancement - Enforce `share_type` guest if applies: [#1046](https://github.com/owncloud/owncloud-sdk/pull/1046)

   With oC10, the `share_type` is not set to guest, if a user shares a resource with a guest user,
   therefore we check if the property `share_with_user_type` is present and set to `guest`, if so
   we manipulate the `share_type` property and set it to guest.

   https://github.com/owncloud/owncloud-sdk/pull/1046


* Enhancement - Enable search results for ocis: [#1057](https://github.com/owncloud/owncloud-sdk/pull/1057)

   We've enabled search results for ocis, which has been skipped before.

   https://github.com/owncloud/owncloud-sdk/pull/1057


* Enhancement - Send oc-etag on putFileContents and getFileContents methods: [#1067](https://github.com/owncloud/owncloud-sdk/pull/1067)

   Due to server encoding, the ETag might differ from OC-ETag, therefore we emit both.

   https://github.com/owncloud/owncloud-sdk/pull/1067


* Enhancement - Add overwrite flag for file move: [#1073](https://github.com/owncloud/owncloud-sdk/pull/1073)

   We've added an overwrite flag for the file move operation

   https://github.com/owncloud/owncloud-sdk/pull/1073


* Enhancement - Add overwrite flag for file copy: [#1087](https://github.com/owncloud/owncloud-sdk/pull/1087)

   We've added an overwrite flag for the file copy operation

   https://github.com/owncloud/owncloud-sdk/pull/1087


* Enhancement - Add role api parameter and stop deleting other params: [#1092](https://github.com/owncloud/owncloud-sdk/pull/1092)

   We've added the option to define a role when sharing a resource. Beside that we've stopped to
   delete certain other parameters when a `space_ref` is provided.

   https://github.com/owncloud/owncloud-sdk/pull/1092


* Enhancement - Add range to search result: [#1112](https://github.com/owncloud/owncloud-sdk/pull/1112)

   We've added the range property to the search result, so we can retrieve the found items, even if
   the search limit will be exceeded.

   https://github.com/owncloud/owncloud-sdk/pull/1112


* Enhancement - Add token info endpoint support: [#1126](https://github.com/owncloud/owncloud-sdk/pull/1126)

   We've added support for the new token info endpoint.

   https://github.com/owncloud/web/issues/7304
   https://github.com/owncloud/owncloud-sdk/pull/1126


* Enhancement - Add overwrite flag for public files move and copy: [#7122](https://github.com/owncloud/web/issues/7122)

   We've added an overwrite flag for the public files move and copy operation

   https://github.com/owncloud/web/issues/7122
   https://github.com/owncloud/owncloud-sdk/pull/1097

# Changelog for [2.0.1] (2022-02-15)

The following sections list the changes in ownCloud SDK 2.0.1.

[2.0.1]: https://github.com/owncloud/owncloud-sdk/compare/v2.0.0...v2.0.1

## Summary

* Bugfix - Trashbin query: [#1002](https://github.com/owncloud/owncloud-sdk/pull/1002)

## Details

* Bugfix - Trashbin query: [#1002](https://github.com/owncloud/owncloud-sdk/pull/1002)

   We've brought back providing a query when listing trashbin contents. This got lost during the
   switch from webdav v1 to v2.

   https://github.com/owncloud/owncloud-sdk/pull/1002

# Changelog for [2.0.0] (2022-02-08)

The following sections list the changes in ownCloud SDK 2.0.0.

[2.0.0]: https://github.com/owncloud/owncloud-sdk/compare/v1.1.2...v2.0.0

## Summary

* Change - Remove webdav v1 api support: [#962](https://github.com/owncloud/owncloud-sdk/pull/962)
* Change - Drop Internet Explorer support: [#966](https://github.com/owncloud/owncloud-sdk/pull/966)
* Change - Pass full file or directory path to methods of Files class: [#971](https://github.com/owncloud/owncloud-sdk/pull/971)
* Change - Use peerDependencies instead of dependencies: [#979](https://github.com/owncloud/owncloud-sdk/pull/979)

## Details

* Change - Remove webdav v1 api support: [#962](https://github.com/owncloud/owncloud-sdk/pull/962)

   The DAV api now uses dav v2 by default, webdav v1 has been entirely removed.

   https://github.com/owncloud/owncloud-sdk/issues/958
   https://github.com/owncloud/owncloud-sdk/pull/962
   https://github.com/owncloud/owncloud-sdk/pull/985


* Change - Drop Internet Explorer support: [#966](https://github.com/owncloud/owncloud-sdk/pull/966)

   Since it's nearing its end-of-life, we've dropped polyfills for IE in favor of a smaller bundle
   size.

   https://github.com/owncloud/owncloud-sdk/pull/966


* Change - Pass full file or directory path to methods of Files class: [#971](https://github.com/owncloud/owncloud-sdk/pull/971)

   Since incompatibility with spaces, we changed the way how the methods of the class
   Files(filesManagement.js) need to be called. Now it is mandatory to pass the full webDav(v2)
   path of a file or directory.

   For example, before this change the path was: 'myfile.txt', with this change it is:
   'files/admin/myfile.txt'

   https://github.com/owncloud/owncloud-sdk/pull/971


* Change - Use peerDependencies instead of dependencies: [#979](https://github.com/owncloud/owncloud-sdk/pull/979)

   In the past, we used dependencies in package.json which lead to a big bundle size and increased
   the possibility that the same package with 2 different versions is part of the final bundle of
   the consuming application.

   From now on, dependencies that are required to use the SDK are added to the peerDependencies
   section in package.json. The consuming application then has to add the dependency on its own
   and can decide which minor or bugfix version to use.

   https://github.com/owncloud/owncloud-sdk/pull/979

# Changelog for [1.1.2] (2022-02-01)

The following sections list the changes in ownCloud SDK 1.1.2.

[1.1.2]: https://github.com/owncloud/owncloud-sdk/compare/v1.1.1...v1.1.2

## Summary

* Bugfix - Graceful reject for failing network request in OCS: [#977](https://github.com/owncloud/owncloud-sdk/pull/977)

## Details

* Bugfix - Graceful reject for failing network request in OCS: [#977](https://github.com/owncloud/owncloud-sdk/pull/977)

   When the network request inside a _makeOCSrequest failed it terminated the entire
   application instead of rejecting the promise. We now catch errors on the network request and
   reject the promise so that applications have a chance to handle the error.

   https://github.com/owncloud/owncloud-sdk/pull/977

# Changelog for [1.1.1] (2022-01-26)

The following sections list the changes in ownCloud SDK 1.1.1.

[1.1.1]: https://github.com/owncloud/owncloud-sdk/compare/v1.1.0...v1.1.1

## Summary

* Bugfix - Always require default axios: [#965](https://github.com/owncloud/owncloud-sdk/pull/965)

## Details

* Bugfix - Always require default axios: [#965](https://github.com/owncloud/owncloud-sdk/pull/965)

   We now always require the default axios since the unspecified require eventually lead to
   problems with unit tests and mocks.

   https://github.com/owncloud/owncloud-sdk/pull/965

# Changelog for [1.1.0] (2022-01-26)

The following sections list the changes in ownCloud SDK 1.1.0.

## Summary

* Enhancement - Previous releases and introducing semver: [#10](https://github.com/owncloud/owncloud-sdk/issues/10)

## Details

* Enhancement - Previous releases and introducing semver: [#10](https://github.com/owncloud/owncloud-sdk/issues/10)

   We created the ownCloud SDK to provide developers with a well documented and easy-to-use
   solution for interaction with ownCloud backends from their JavaScript applications.

   While in the previous years, each successful CI run would publish a new version of the SDK, we
   have now switched to [semantic versioning](https://semver.org/).

   https://github.com/owncloud/owncloud-sdk/issues/10
   https://owncloud.github.io/owncloud-sdk/

