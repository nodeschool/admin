var log = require('npmlog')
var eventTime = require('./eventTime')
var countries
var joi

function extraCheckEvent (event) {
  var time = eventTime.forEvent(event)
  if (time.duration <= 0) {
    return function (path, nr) {
      throw new Error('Event end is before start: ' + path)
    }
  }
}

module.exports = {
  validate: function (schema, path, data) {
    if (!data) {
      return Promise.reject({
        type: 'json',
        message: path + ' is empty.'
      })
    }
    if (!joi) {
      joi = require('joi')
    }
    log.verbose('check', 'Validating ' + path)
    return new Promise(function (resolve, reject) {
      setImmediate(function () {
        var result = joi.validate(data, schema, {abortEarly: false})
        if (result.error) {
          reject({
            type: 'json',
            message: result.error.message
          })
        } else {
          log.verbose('pass', path + ' is perfect!')
          resolve(data)
        }
      })
    })
  },
  event: function (path, data) {
    return this.validate(require('./schema/event'), path, data)
      .then(function (event) {
        var err = extraCheckEvent(event)
        return err ? err(path) : event
      })
  },
  events: function (path, data) {
    return this.validate(require('./schema/events'), path, data)
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
  },
  chapter: function (path, data) {
    return this.validate(require('./schema/chapter'), path, data)
    .then(function (chapter) {
      if (!countries) {
        countries = require('../../country_designations')
      }
      var cntrs = countries.byGroup
      for (var c in cntrs) {
        if (cntrs.hasOwnProperty(c)) {
          cntrs[c].forEach(function (item) {
            if (item === chapter.location.country) {
              chapter.region = c
            }
          })
        }
      }
      return chapter
    })
  }
}
