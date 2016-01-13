var log = require('npmlog')
var path = require('path')
var fs = require('fs')

module.exports = {
  description: 'Create an event.',
  help: function () {
    return fs.readFileSync(path.resolve(__dirname, 'init.help'), 'utf8')
  },
  run: function (input) {
    var Git = require('nodegit')
    var chapter = input.argv.remain[1]
    var path = path.resolve(input.argv.remain[2] || path.join(process.cwd(), input.name()))
  }
}
