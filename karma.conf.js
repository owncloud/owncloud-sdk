const path = require('path')

module.exports = function (config) {
  config.set({
    client: {
      jasmine: {
        random: false,
        timeoutInterval: 10000
      },
      captureConsole: true,

      // pass through console.log output
      browserConsoleLogOptions: {
        terminal: true,
        level: ""
      }
    },

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    plugins: [
      'karma-jasmine',
      'karma-webpack',
      'karma-coverage-istanbul-reporter',
      'karma-chrome-launcher',
      'karma-sourcemap-loader',
      'karma-babel-preprocessor',
      '@pact-foundation/karma-pact'
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'pact'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/@babel/polyfill/dist/polyfill.js',
      'tests/karma.js'
    ],

    // list of files / patterns to exclude
    exclude: [],

    pact: [{
      port: 1234,
      consumer: 'owncloud-sdk',
      provider: 'oc-server',
      dir: 'tests/pact/',
      log: 'tests/log/pact.log',
    }],

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
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
          },
          {
            test: /\.js$/,
            exclude: [/node_modules/],
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
    reporters: ['progress', 'coverage-istanbul'],

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
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    coverageIstanbulReporter: {
      reports: ['lcovonly', 'text'],
      dir: path.join(__dirname, 'coverage'),
      fixWebpackSourcePaths: true
    },
    browserDisconnectTimeout: 20000,
  })
}
