var log = require('npmlog')
var fs = require('fs')
var path = require('path')
var util = require('util')
var tzLookup

var _validate
function validate () {
  if (!_validate) {
    _validate = require('../util/validate')
  }
  return _validate
}

var _github
function github () {
  if (!_github) {
    _github = require('../util/github')
  }
  return _github
}

function downloadChapters (input, chapterNames) {
  var ProgressBar = require('progress')
  var bar = new ProgressBar(':percent :etas - Checking :name', { total: chapterNames.length })
  var chapters = {}
  var self = this
  tzLookup = require('tz-lookup')
  return require('bluebird').each(chapterNames, function (chapterName) {
    bar.tick({
      'name': chapterName
    })
    return self.downloadChapter(input, chapterName)
      .then(function (chapter) {
        if (chapter) {
          chapters[chapterName] = chapter
        }
      })
  })
    .then(function () {
      // TODO: need to implement organizers lookup
      return chapters
    })
}

function downloadChapter (input, chapterName) {
  var self = this
  return this.downloadChapterJson(input, chapterName)
    .then(function (chapter) {
      if (chapter) {
        chapter.website = 'https://nodeschool.io/' + chapterName
        chapter.repo = 'https://github.com/nodeschool/' + chapterName
        chapter.organizers = 'Only available through `.downloadChapters` (performance reasons)'
        if (chapter.location.lat && chapter.location.lng) {
          chapter.location.timezone = tzLookup(chapter.location.lat, chapter.location.lng)
        }
        return self.downloadEventsJson(input, chapterName)
          .then(function (events) {
            chapter.events = events
            return chapter
          })
      }
    })
}

function downloadChapterJson (input, chapterName) {
  var url = 'http://nodeschool.io/' + chapterName + '/chapter.json'
  return require('../util/json').fromUrl(input, url)
    .catch(function (e) {})
    .then(function (chapter) {
      if (chapter) {
        return validate().chapter(url, chapter)
          .then(function () {
            log.verbose('json', url + ' found valid chapter ' + chapterName)
            return chapter
          })
          .catch(function (e) {
            log.warn('json', url + ' exists but is invalid:\n' + util.inspect(e))
          })
      }
    })
}

function downloadEventsJson (input, chapterName) {
  log.verbose('github', 'Looking for events for ' + chapterName + '.')
  var url = 'http://nodeschool.io/' + chapterName + '/events.json'
  return require('../util/json').fromUrl(input, url)
    .catch(function () { /* Ignoring error */ })
    .then(function (events) {
      return validate().events(url, events)
        .catch(function (e) {
          log.warn('json', url + ' exists but is invalid:\n' + util.inspect(e))
          return []
        })
    })
}

module.exports = {
  description: 'List all chapters.',
  help: function () {
    return fs.readFileSync(path.resolve(__dirname, 'list.help'), 'utf8')
  },
  helpPath: 'lib/standard/list.help',
  downloadChapters: downloadChapters,
  downloadChapter: downloadChapter,
  downloadChapterJson: downloadChapterJson,
  downloadEventsJson: downloadEventsJson,
  run: function (input) {
    var self = this
    log.info('github', 'Loading all public repos.')
    return github().all(input, 'orgs/nodeschool/repos?type=public')
      .then(function (repos) {
        log.verbose('json', 'Found ' + repos.length + ' repositories.\n')
        return self.downloadChapters(input, repos.map(function (repo) {
          return repo.name
        }))
      })
  }
}
