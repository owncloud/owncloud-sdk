module.exports = {
  mode: 'production',
  entry: {
    files: [
      'core-js/modules/es6.promise',
      'core-js/modules/es6.array.iterator',
      './src/index.js'
    ]
  },
  output: {
    filename: 'owncloud.js'
  },
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
