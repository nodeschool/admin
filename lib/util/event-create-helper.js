var eventTime = require('./eventTime')
var json = require('./json')

var latLngRegex = /^(-?[0-9]+(\.[0-9]+)?)\/(-?[0-9]+(\.[0-9]+)?)$/

function toLatLng (latLngString) {
  var parts = latLngRegex.exec(latLngString)
  if (parts) {
    return {
      lat: parseFloat(parts[1], 10),
      lng: parseFloat(parts[3], 10)
    }
  }
}
function assertLatLng (raw) {
  var latLng = toLatLng(raw)
  if (!latLng) {
    return 'Invalid formatting.'
  }
  if (latLng.lat <= -90) {
    return 'Latitude has to be bigger or equal -90.'
  }
  if (latLng.lat >= 90) {
    return 'Latitude has to be smaller or equal 90.'
  }
  if (latLng.lng <= -180) {
    return 'Longitude has to be bigger or equal -180.'
  }
  if (latLng.lng >= 180) {
    return 'Longitude has to be smaller or equal 180.'
  }
  return true
}

function assertNotEmpty (name) {
  return function (raw) {
    return raw.length > 0 ? true : 'The ' + name + ' can not be empty!'
  }
}

function assertDate (raw) {
  return eventTime.dateRegex.test(raw) ? true : 'Invalid date formatting.'
}
function assertTime (raw) {
  return eventTime.timeRegex.test(raw) ? true : 'Invalid time formatting.'
}

function generateSugestions (events) {
  var eventNames = Object.keys(events || {})
  var suggestions = {
    eventCount: eventNames.length,
    commonPrefix: '',
    usualStartTime: undefined,
    usualEndTime: undefined,
    nextSameWeekday: undefined
  }
  var locationMap = {}
  suggestions.events = eventNames.map(function (eventName) {
    return {
      name: eventName,
      data: events[eventName]
    }
  }).sort(function (setA, setB) {
    if (setA.data.startDate < setB.data.startDate) {
      return -1
    }
    if (setA.data.startDate > setB.data.startDate) {
      return 1
    }
    return 0
  })

  suggestions.events.forEach(function (eventSet) {
    var event = eventSet.data
    var current = locationMap[event.location.name]
    if (!current || event.startDate > current.data.startDate) {
      locationMap[event.location.name] = eventSet
    }
  })
  suggestions.locations = Object.keys(locationMap).map(function (locationName) {
    return locationMap[locationName].data.location
  })
  return {suggestions: suggestions, locationMap: locationMap}
}

var askForUrl = {
  name: 'url',
  message: 'What URL can people use to sign up for the event or get more information about it?',
  type: 'input',
  validate: function (raw) {
    var urlParts = require('url').parse(raw)
    if (
      urlParts && (urlParts.protocol === 'http:' || urlParts.protocol === 'https:') &&
      urlParts.host
    ) {
      return true
    }
    return 'Invalid URL format.'
  }
}
function askForName (input, suggestions, locations) {
  return {
    name: 'name',
    message: 'What is the name of this event?',
    type: 'input',
    default: function () {
      if (input['event-name']) {
        return input['event-name']
      }
      if (suggestions.commonPrefix) {
        return suggestions.commonPrefix + suggestions.events.length
      }
      return 'NodeSchool ' +
      (input.chapter.charAt(0).toUpperCase() + input.chapter.substr(1)) + ' ' +
      ((suggestions.events.length === 0) ? 'Kick-Off' : ('#' + (suggestions.events.length + 1)))
    },
    validate: function (raw) {
      var result = assertNotEmpty('name')(raw)
      if (result === true && locations.indexOf(raw) !== -1) {
        result = 'Name is already taken!'
      }
      return result
    }
  }
}
function askForContact () {
  return {
    name: 'contact',
    type: 'input',
    message: 'Whats your contact email adress?',
    validate: assertNotEmpty('name of the location')
  }
}
function askForLocation (locationAvailable, locations) {
  return {
    when: locationAvailable,
    name: 'location-name',
    message: 'What location do you want to use?',
    type: 'list',
    choices: locations.concat('Create new location')
  }
}
function askForLocationName (locationMissing, input) {
  return {
    name: 'newLocation.name',
    message: 'Please the name for a new location:',
    when: locationMissing,
    default: function (data) {
      return input['event-location-name']
    },
    validate: assertNotEmpty('name of the location')
  }
}
function askForPosition (input, locationMap) {
  return {
    name: 'newLocation.latLng',
    message: 'The position of the location (lat/lng):',
    default: function (data) {
      if (input['event-location-lat'] && input['event-location-lng']) {
        return input['event-location-lat'] + '/' + input['event-location-lng']
      }
      if (locationMap[data['location-name']]) {
        var location = locationMap[data['location-name']].data.location
        return location.lat + '/' + location.lng
      }
    },
    validate: assertLatLng
  }
}

function askForOpenDate (input, suggestions) {
  return {
    name: 'openDate',
    message: 'What day will it start? (Format: YYYY/MM/DD or DD.MM.YYYY)',
    type: 'input',
    default: function (result) {
      return result.openDate || input['event-start-date'] || input['event-date'] || suggestions.nextSameWeekday
    },
    validate: assertDate
  }
}

function askForOpenTime (input, suggestions) {
  return {
    name: 'openTime',
    message: 'What time will it start? (Format: HH:MM or HH(:MM)a|pm)',
    type: 'input',
    default: function (result) {
      return result.openTime || input['event-start-time'] || input['event-time'] || suggestions.lastStartTime
    },
    validate: assertTime
  }
}

function askForEndDate () {
  return {
    name: 'endDate',
    message: 'What day will it end? (Format: YYYY/MM/DD or DD.MM.YYYY)',
    type: 'input',
    default: function (result) {
      return result.openDate
    },
    validate: function (raw, data) {
      var result = assertDate(raw)
      if (result === true) {
        var duration = eventTime.forEvent({
          openDate: data.openDate,
          openTime: '00:00',
          endDate: raw,
          endTime: '00:00',
          location: {
            timeZone: 'UTC'
          }
        }).durationInMs
        if (duration < 0) {
          return 'The end date needs to be at the same day or after the start date.'
        } else {
          return true
        }
      }
      return result
    }
  }
}
function askForEndTime () {
  return {
    name: 'endTime',
    message: 'What time will it end? (Format: HH:MM or HH(:MM)a|pm)',
    type: 'input',
    default: function (result) {
      return result.endTime
    },
    validate: function (raw, data) {
      var result = assertTime(raw)
      if (result === true) {
        var eT = eventTime.forEvent({
          openDate: data.openDate,
          openTime: data.openTime,
          endDate: data.endDate,
          endTime: raw,
          location: {
            timeZone: 'UTC' // we need a timezone, but it doesn't matter which
          }
        })
        var duration = eT.durationInMs
        if (duration <= 0) {
          return 'The end time needs to be after the start time.'
        } else {
          return true
        }
      }
      return result
    }
  }
}

function generateEventName (event) {
  var name = event.name.split(' ').join('-')
  return event.openDate + '_' + event.openTime + '_' + name + '.json'
}
function generateDate (date) {
  var moment = require('moment')
  var day = moment(date, 'YYYY/MM/DD').format('YYYY-MM-DD')
  if (date.indexOf('.') > 0) {
    day = moment(date, 'DD.MM.YYYY').format('YYYY-MM-DD')
  }
  return day
}
function generateTime (time) {
  return time.split(':').join('-')
}

function generateEvent (eventInput) {
  var event = {}
  var location = Object.assign({}, toLatLng(eventInput['newLocation.latLng']))
  location.place = eventInput['newLocation.name'] || eventInput['location-name']
  event = {
    name: eventInput.name,
    location: location,
    openDate: generateDate(eventInput.openDate),
    openTime: generateTime(eventInput.openTime),
    endDate: generateDate(eventInput.endDate),
    endTime: generateTime(eventInput.endTime),
    url: eventInput.url,
    contact: eventInput.contact
  }
  return event
}

function loadChapter (chapterJsonPath) {
  return json.read(chapterJsonPath)
    .catch(function (e) {})
    .then(function (chapter) {
      return require('../util/validate').chapter(chapterJsonPath, chapter)
    })
}

function validateEvent (path, name) {
  var file = require('path').resolve(path, 'events', name)
  var buffer = require('fs').readFileSync(file)
  try {
    var validationResult = require('open-event').validate(file, buffer)
    return validationResult
  } catch (e) {
    throw e
  }
}

module.exports = {
  loadChapter: loadChapter,
  assertLatLng: assertLatLng,
  generateSugestions: generateSugestions,
  askForUrl: askForUrl,
  askForName: askForName,
  askForContact: askForContact,
  askForLocation: askForLocation,
  askForLocationName: askForLocationName,
  askForPosition: askForPosition,
  askForOpenDate: askForOpenDate,
  askForOpenTime: askForOpenTime,
  askForEndDate: askForEndDate,
  askForEndTime: askForEndTime,
  generateEvent: generateEvent,
  generateEventName: generateEventName,
  validateEvent: validateEvent
}
