# Changelog for [unreleased] (UNRELEASED)

The following sections list the changes in ownCloud SDK unreleased.

[unreleased]: https://github.com/owncloud/owncloud-sdk/compare/v1.1.0...master

## Summary

* Change - Drop Internet Explorer support: [#966](https://github.com/owncloud/owncloud-sdk/pull/966)

## Details

* Change - Drop Internet Explorer support: [#966](https://github.com/owncloud/owncloud-sdk/pull/966)

   Since it's nearing its end-of-life, we've dropped polyfills for IE in favor of a smaller bundle
   size.

   https://github.com/owncloud/owncloud-sdk/pull/966

# Changelog for [1.1.0] (2022-01-26)

The following sections list the changes in ownCloud SDK 1.1.0.

[1.1.0]: https://github.com/owncloud/owncloud-sdk/compare/v1.1.1...v1.1.0

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

# Changelog for [1.1.1] (2022-01-26)

The following sections list the changes in ownCloud SDK 1.1.1.

## Summary

* Bugfix - Always require default axios: [#965](https://github.com/owncloud/owncloud-sdk/pull/965)

## Details

* Bugfix - Always require default axios: [#965](https://github.com/owncloud/owncloud-sdk/pull/965)

   We now always require the default axios since the unspecified require eventually lead to
   problems with unit tests and mocks.

   https://github.com/owncloud/owncloud-sdk/pull/965

