var log = require('npmlog')
var fs = require('fs')
var path = require('path')
var util = require('util')

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
  return require('bluebird').each(chapterNames, function (chapterName) {
    bar.tick({
      'name': chapterName
    })
    return downloadChapter(input, chapterName)
      .then(function (chapter) {
        if (chapter) {
          chapters[chapterName] = chapter
        }
      })
  })
    .then(function () {
      return github().teamMembers(input, 'nodeschool', Object.keys(chapters))
        .then(function (allChapterMembers) {
          Object.keys(chapters).forEach(function (chapterName) {
            chapters[chapterName].organizers = allChapterMembers[chapterName] || []
          })
          return chapters
        })
    })
}

function downloadChapter (input, chapterName) {
  return downloadChapterJson(input, chapterName)
    .then(function (chapter) {
      if (chapter) {
        return downloadEventsJson(input, chapterName)
          .then(function (events) {
            chapter.events = events
            chapter.website = 'https://nodeschool.io/' + chapterName
            chapter.repo = 'https://github.com/nodeschool/' + chapterName
            chapter.organizers = 'Only available through `.downloadChapters` (performance reasons)'
            return chapter
          })
      }
    })
}

function downloadChapterJson (input, chapterName) {
  var url = 'http://nodeschool.io/' + chapterName + '/chapter.json'
  return require('../util/json').fromUrl(input, url)
    .catch(function (e) {})
    .then(function (data) {
      if (data) {
        return validate().chapter(url, data)
          .then(function () {
            log.verbose('json', url + ' found valid chapter ' + chapterName)
            return data
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
    log.info('github', 'Loading all public repos.')
    return github().all(input, 'orgs/nodeschool/repos?type=public')
      .then(function (repos) {
        log.verbose('json', 'Found ' + repos.length + ' repositories.\n')
        return downloadChapters(input, repos.map(function (repo) {
          return repo.name
        }))
      })
  }
}
