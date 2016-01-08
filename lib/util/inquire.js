var inquirer

module.exports = function (tasks) {
  var args = arguments
  return new Promise(function (resolve, reject) {
    if (!inquirer) {
      inquirer = require('inquirer')
    }
    inquirer.prompt(tasks, resolve)
  })
}
