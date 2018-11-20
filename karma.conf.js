const path = require('path')

module.exports = function (config) {
  var ownCloudConfig = require('./owncloud/test/config.json')
  config.set({

    client: {
      ownCloudConfig: ownCloudConfig,
      jasmine: {
        random: false
      }
    },

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'tests/karma.js',
      'node_modules/utf8/utf8.js',
      'tests/unauthenticated/*Test.js',
      'tests/unauthorized/*Test.js',
      'tests/*Test.js'
    ],

    // list of files / patterns to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'tests/karma.js': ['webpack']
    },

    webpack: {
      output: {
        filename: 'bundle.js'
      },
      resolve: {
        extensions: ['.js', '.json']
      },
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: [ path.resolve(__dirname, 'test'), /node_modules/ ],
            enforce: 'post',
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: { esModules: true }
            }
          }
        ]
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'coverage-istanbul'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless', 'Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    coverageIstanbulReporter: {
      reports: [ 'lcovonly', 'text' ],
      dir: path.join(__dirname, 'coverage'),
      fixWebpackSourcePaths: true
    }
  })
}
