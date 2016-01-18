var log = require('npmlog')
var eventTime = require('./eventTime')
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
        resolve(data)
      }
    })
  })
}

function extraCheckEvent (event) {
  var time = eventTime.forEvent(event)
  if (time.duration <= 0) {
    return function (path, nr) {
      throw new Error('Event end is before start: ' + path)
    }
  }
}

function validateEvents (path, data) {
  return validate(require('./schema/events'), path, data)
    .then(function (events) {
      if (events) {
        var eventNames = Object.keys(events)
        for (var i = 0; i < eventNames.length; i++) {
          var eventName = eventNames[i]
          var err = extraCheckEvent(events[eventName])
          if (err) {
            return err(path + '#' + eventName)
          }
        }
      }
      return events
    })
}

function validateEvent (path, data) {
  return validate(require('./schema/event'), path, data)
    .then(function (event) {
      var err = extraCheckEvent(event)
      return err ? err(path) : event
    })
}

function validateChapter (path, data) {
  return validate(require('./schema/chapter'), path, data)
}

module.exports = {
  event: validateEvent,
  events: validateEvents,
  chapter: validateChapter
}
