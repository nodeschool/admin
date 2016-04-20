var log = require('npmlog')
var eventTime = require('./eventTime')
var designations
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
  chapter: function (path, data) {
    return this.validate(require('./schema/chapter'), path, data)
    .then(function (chapter) {
      if (!countries) {
        designations = require('../../country_designations')
      }
      var countries = designations.byCountry
      var region = countries[chapter.location.country]
      if (region) {
        chapter.region = region
      }
      return chapter
    })
  }
}
