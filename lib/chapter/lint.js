var fs = require('fs')
var log = require('npmlog')
var path = require('path')

module.exports = {
  description: 'Lint the chapter.',
  run: function (input, remote) {
    var json = require('../util/json')
    var joi = require('joi')
    var chapterJsonPath = path.join(input.path, 'chapter.json')
    var eventsJsonPath = path.join(input.path, 'events.json')

    function validate (path, data, schema) {
      log.info('check', 'Validating ' + path)
      return new Promise(function (resolve, reject) {
        setImmediate(function () {
          var result = joi.validate(data, schema, {abortEarly: false})
          if (result.error) {
            console.log(result.error)

            reject({
              type: 'json',
              message: result.error.message
            })
          } else {
            log.info('pass', path + ' is perfect!')
            resolve()
          }
        })
      })
    }

    return json.read(chapterJsonPath)
      .then(function (json) {
        return validate(chapterJsonPath, json, require('./schema/chapter'))
      })
      .then(function () {
        return json.read(eventsJsonPath)
      })
      .then(function (json) {
        return validate(eventsJsonPath, json, require('./schema/event'))
      })
      .then(function () {
        log.info('pass', 'Congratulations: all files are valid.')
      })

  }
}
