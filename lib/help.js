module.exports = function (mode) {
  return {
    description: 'Choose a help topic.',
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
          return '\nUsage: nodeschool-chapter ' + cmdName + ' ' + (cmd.parameters || '') + '\n\n' + cmd.help() + '\n'
        })
    }
  }
}
