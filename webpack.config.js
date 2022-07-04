const ESLintPlugin = require('eslint-webpack-plugin')
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
  plugins: [
    new ESLintPlugin({
      useEslintrc: true
    }
    ),
  ],
  module: {
    rules: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  }
}
