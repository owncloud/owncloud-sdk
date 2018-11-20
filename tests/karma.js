require('../owncloud')

var context = require.context('.', true, /Test\.js$/)
context.keys().forEach(context)
