var fs = require('fs')
var path = require('path')

module.exports = function (mode) {
  return {
    description: 'Choose a help topic.',
    key: 'h',
    run: function (input) {
      var inquire = require('./util/inquire')
      return Promise.resolve()
        .then(function () {
          if (input.argv.remain.length === 0) {
            return inquire.commands(mode, {name: 'command', type: 'list', message: 'What do you need help with?'})
              .then(function (result) {
                input.argv.remain.splice(0, 0, result.command)
                return input
              })
          }
          return input
        })
        .then(function (input) {
          var cmdName = input.argv.remain[0]
          var cmd = mode[cmdName]
          return '\nUsage: nodeschool-admin ' + cmdName + ' ' + (cmd.parameters || '') + '\n\n' +
            cmd.help() + '\n' +
            (cmd.helpPath ? 'https://github.com/nodeschool/admin/blob/master/' + cmd.helpPath + '\n' : '') +
            '\n\n' + fs.readFileSync(path.join(__dirname, 'common.help'), 'utf8')
        })
    }
  }
}
