require('../src')

const context = require.context('.', true, /Test\.js$/)
context.keys().forEach(context)
