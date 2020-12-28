"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var pact = require("@pact-foundation/pact");
var path = require("path");
var logHint = function (options) {
    return options.port ? "-port-" + options.port : '';
};
var applyDefaults = function (options) { return (__assign({ log: path.resolve(options.logDir ? options.logDir : path.join(process.cwd(), 'pact', 'logs'), options.logFileName
        ? options.logFileName
        : options.consumer + "-" + options.provider + "-mockserver-interaction" + logHint(options) + ".log"), dir: path.resolve(process.cwd(), 'pact/pacts'), spec: 2, logLevel: 'warn', pactfileWriteMode: 'update' }, options)); };
var setupProvider = function (options) {
    var pactMock = new pact.Pact(options);
    beforeAll(function () { return pactMock.setup(); });
    afterAll(function () { return pactMock.finalize(); });
    afterEach(function () { return pactMock.verify(); });
    return pactMock;
};
// This should be moved to pact-js, probably
exports.getProviderBaseUrl = function (provider) {
    return provider.mockService
        ? provider.mockService.baseUrl
        : "http://" + provider.opts.host + ":" + provider.opts.port;
};
var jestPactWrapper = function (options, tests) {
    var pactTestTimeout = options.timeout || 30000;
    describe("with " + pactTestTimeout + " ms timeout for Pact", function () {
        var originalTimeout;
        beforeAll(function () {
            // Jest's default timeout is 5000, and jest doesn't provide a way of
            // asking what the current timeout is. In Jest 24 and 25, Jasmine was probably
            // the test runner, so we can ask Jasmine if it is there. In later versions of
            // Jest (eg 26 and up), Jasmine may not be defined.
            // See https://github.com/pact-foundation/jest-pact/issues/197 for discussion
            //
            // For now, we just assume that 5000 was the original timeout.
            // The impact is likely to be small, as `jest.setTimeout()` only works for the
            // current test file
            originalTimeout = global.jasmine
                ? global.jasmine.DEFAULT_TIMEOUT_INTERVAL
                : 5000;
            jest.setTimeout(pactTestTimeout);
        });
        afterAll(function () {
            jest.setTimeout(originalTimeout);
        });
        tests(setupProvider(applyDefaults(options)));
    });
};
var describeString = function (options) {
    return "Pact between " + options.consumer + " and " + options.provider;
};
exports.pactWith = function (options, tests) {
    return describe(describeString(options), function () { return jestPactWrapper(options, tests); });
};
exports.xpactWith = function (options, tests) { return xdescribe(describeString(options), function () { return jestPactWrapper(options, tests); }); };
exports.fpactWith = function (options, tests) { return fdescribe(describeString(options), function () { return jestPactWrapper(options, tests); }); };
