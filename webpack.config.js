const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  entry: {
    files: [
      '@babel/polyfill',
      './src/index.js'
    ]
  },
  output: {
    filename: 'owncloud.js',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  target: 'node', // in order to ignore built-in modules like path, fs, etc.
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  module: {
    rules: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }, {
      enforce: 'pre',
      test: /\.(js|vue)$/,
      exclude: /node_modules/,
      loader: 'eslint-loader'
    }]
  }
}
