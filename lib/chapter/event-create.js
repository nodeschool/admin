var path = require('path')
var fs = require('fs')
module.exports = {
  description: 'Create an event.',
  help: function () {
    return fs.readFileSync(path.resolve(__dirname, 'event-create.help'), 'utf8')
  },
  helpPath: 'lib/chapter/event-create.help',
  run: function (input, remote) {
    var json = require('../util/json')
    var chapterJsonPath = path.resolve(input.path, 'chapter.json')
    var eventsJsonPath = path.resolve(input.path, 'events.json')
    var inquire = require('../util/inquire')
    var eventHelper = require('../util/event-create-helper')
    return require('../util/repo').clean(remote, input.branch, ['events.json'])
      .then(function () {
        return json.read(chapterJsonPath)
          .then(function (chapter) {
            return require('../util/validate').chapter(chapterJsonPath, chapter)
          })
      })
      .then(function () {
        return json.read(eventsJsonPath)
          .catch(function (e) {})
          .then(function (events) {
            if (events) {
              return require('../util/validate').events(eventsJsonPath, events)
            }
            return {}
          })
      })
      .then(function (events) {
        var generatedSugestions = eventHelper.generateSugestions(events)
        var suggestions = generatedSugestions.suggestions
        var locationMap = generatedSugestions.locationMap
        var locations = suggestions.locations.map(function (location) {
          return location.name
        })
        function locationAvailable () {
          return locations.length > 0
        }
        function locationMissing () {
          return locations.length === 0
        }
        return inquire.run([
          eventHelper.askForUrl,
          eventHelper.askForName(input, suggestions, locations),
          eventHelper.askForLocation(locationAvailable, locations),
          eventHelper.askForLocationName(locationMissing, input),
          eventHelper.askForPosition(input, locationMap),
          eventHelper.askForStartDate(input, suggestions),
          eventHelper.askForStartTime(input, suggestions),
          eventHelper.askForEndDate(),
          eventHelper.askForEndTime()
        ])
        .then(function (eventInput) {
          return eventHelper.generateEvent(events, eventInput)
        })
      })
      .then(function (events) {
        return require('../util/fs').save(eventsJsonPath, JSON.stringify(events, null, 2))
      })
  }
}
