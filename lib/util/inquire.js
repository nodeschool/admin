var inquirer

function inquire (tasks) {
  return new Promise(function (resolve, reject) {
    if (!inquirer) {
      inquirer = require('inquirer')
    }
    inquirer.prompt(tasks, resolve)
  })
}

inquire.commands = function (commands, task) {
  var commandNames = Object.keys(commands)
  var maxLength = commandNames.reduce(function (maxLength, entry) {
    return (entry.length > maxLength) ? entry.length : maxLength
  }, 0)

  task.choices = commandNames.map(function (key) {
    var cmd = commands[key]
    return {
      name: key + ' ' + new Array(maxLength - key.length + 1).join('.') + '... ' + cmd.description,
      value: key,
      short: key
    }
  })
  return inquire.run(task)
}

module.exports.run = inquire
