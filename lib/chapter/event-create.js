var path = require('path')
var fs = require('fs')
module.exports = {
  description: 'Create an event.',
  help: function () {
    return fs.readFileSync(path.resolve(__dirname, 'event-create.help'), 'utf8')
  },
  helpPath: 'lib/chapter/event-create.help',
  run: function (input, remote) {
    var chapterJsonPath = path.resolve(input.path, 'chapter.json')
    var inquire = require('../util/inquire')
    var eventHelper = require('../util/event-create-helper')
    return require('../util/repo').clean(remote, input.branch, [])
      .then(function () {
        return eventHelper.loadChapter(chapterJsonPath)
      })
      .then(function () {
        // TODO: Add generating of suggestions
        var suggestions = {events: []}
        var locations = []
        var locationMap = {}
        // var generatedSugestions = eventHelper.generateSugestions(events)
        // var suggestions = generatedSugestions.suggestions
        // var locationMap = generatedSugestions.locationMap
        // var locations = suggestions.locations.map(function (location) {
        //   return location.name
        // })
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
          return eventInput
        })
      })
      .then(function (event) {
        var generatedEvent = eventHelper.generateEvent(event)
        var name = eventHelper.generateEventName(event)
        // check if the events folder exists
        fs.existsSync('events') || fs.mkdirSync('events')

        var eventsPath = path.resolve(input.path, 'events', name)
        return require('../util/fs').save(eventsPath, JSON.stringify(generatedEvent, null, 2))
      })
  }
}
