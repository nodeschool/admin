var log = require('npmlog')
var joi

function validate (schema, path, data) {
  if (!data) {
    return Promise.reject({
      type: 'json',
      message: path + ' is empty.'
    })
  }
  if (!joi) {
    joi = require('joi')
  }
  log.info('check', 'Validating ' + path)
  return new Promise(function (resolve, reject) {
    setImmediate(function () {
      var result = joi.validate(data, schema, {abortEarly: false})
      if (result.error) {
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

function validateEvents (path, data) {
  return validate(require('./schema/event'), path, data)
}

function validateChapter (path, data) {
  return validate(require('./schema/chapter'), path, data) 
}

module.exports = {
  events: validateEvents,
  chapter: validateChapter
}
