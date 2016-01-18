var log = require('npmlog')
var path = require('path')
var fs = require('fs')

module.exports = {
  description: 'Lint the chapter.',
  help: function () {
    return fs.readFileSync(path.resolve(__dirname, 'lint.help'), 'utf8')
  },
  helpPath: 'lib/chapter/lint.help',
  run: function (input, remote) {
    var json = require('../util/json')
    var validate = require('../util/validate')
    var chapterJsonPath = path.join(input.path, 'chapter.json')
    var eventsJsonPath = path.join(input.path, 'events.json')

    return json.read(chapterJsonPath)
      .then(function (json) {
        return validate.chapter(chapterJsonPath, json)
      })
      .then(function () {
        return json.read(eventsJsonPath)
      })
      .then(function (json) {
        return validate.events(eventsJsonPath, json)
      })
      .then(function () {
        log.info('pass', 'Congratulations: all files are valid.')
      })
  }
}
