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

* Change - Drop Internet Explorer support: [#966](https://github.com/owncloud/owncloud-sdk/pull/966)
* Change - Pass full file or directory path to methods of Files class: [#971](https://github.com/owncloud/owncloud-sdk/pull/971)
* Change - Use peerDependencies instead of dependencies: [#979](https://github.com/owncloud/owncloud-sdk/pull/979)
* Change - Remove webdav v1 api support: [#962](https://github.com/owncloud/owncloud-sdk/pull/962)

## Details

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


* Change - Remove webdav v1 api support: [#962](https://github.com/owncloud/owncloud-sdk/pull/962)

   The DAV api now uses dav v2 by default, webdav v1 has been entirely removed.

   https://github.com/owncloud/owncloud-sdk/issues/958
   https://github.com/owncloud/owncloud-sdk/pull/962
   https://github.com/owncloud/owncloud-sdk/pull/985

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

