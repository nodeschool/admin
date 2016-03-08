var log = require('npmlog')
var fs = require('fs')
var path = require('path')
var util = require('util')
var json = require('../util/json')

var _validate
function validate () {
  if (!_validate) {
    _validate = require('../util/validate')
  }
  return _validate
}

var _tzLookup
function tzLookup () {
  if (!_tzLookup) {
    _tzLookup = require('tz-lookup')
  }
  return _tzLookup.apply(null, arguments)
}

function downloadChapters (input, chapterSlugs) {
  var ProgressBar = require('progress')
  var bar = new ProgressBar(':percent :etas - Checking :name', { total: chapterSlugs.length })
  var chapters = []
  var self = this
  var tasks = chapterSlugs.map(function (chapterSlug) {
    return self.downloadChapter(input, chapterSlug)
      .then(function (chapter) {
        bar.tick({
          'name': chapterSlug
        })
        if (chapter) {
          chapters.push(chapter)
        }
      })
  })
  return require('bluebird').all(tasks).then(function () {
    return chapters
  })
}

function downloadChapter (input, chapterSlug) {
  var self = this
  return this.downloadChapterJson(input, chapterSlug)
    .then(function (chapter) {
      if (chapter) {
        chapter.website = 'https://nodeschool.io/' + chapterSlug
        chapter.repo = 'https://github.com/nodeschool/' + chapterSlug
        chapter.slug = chapterSlug
        chapter.location.timezone = tzLookup(chapter.location.lat, chapter.location.lng)
        return self.downloadEventsJson(input, chapterSlug)
          .then(function (events) {
            chapter.events = events
            return chapter
          })
      }
    })
}

function downloadChapterJson (input, chapterSlug) {
  var url = 'http://nodeschool.io/' + chapterSlug + '/chapter.json'
  return require('../util/json').fromUrl(input, url)
    .catch(function (e) {})
    .then(function (chapter) {
      if (chapter) {
        return validate().chapter(url, chapter)
          .then(function () {
            log.verbose('json', url + ' found valid chapter ' + chapterSlug)
            return chapter
          })
          .catch(function (e) {
            log.warn('json', url + ' exists but is invalid:\n' + util.inspect(e))
          })
      }
    })
}

function downloadEventsJson (input, chapterSlug) {
  log.verbose('github', 'Looking for events for ' + chapterSlug + '.')
  var url = 'http://nodeschool.io/' + chapterSlug + '/events.json'
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

function downloadTeamsJson () {
  var teamListUrl = 'http://team.nodeschool.io/teams.json'
  log.info('github', 'Looking for github teams at ' + teamListUrl)
  return json
    .fromUrl({}, teamListUrl)
    .then(function (teams) {
      if (!teams) {
        teams = []
      }
      log.verbose('github', 'Found github ' + teams.length + ' teams.')
      return teams.filter(function (team) {
        for (var i = 0; i < team.repos.length; i++) {
          var repo = team.repos[i]
          if (repo.name === team.slug) {
            return true
          }
        }
        log.verbose('github', 'Ignoring team ' + team.slug + ' because there is no repo it owns that matches its name.')
        return false
      })
    })
}

function mergeChaptersAndTeams (chapters, teams) {
  log.verbose('list', 'Merging chapters and teams...')
  chapters.forEach(function (chapter) {
    teams.forEach(function (team) {
      if (chapter.slug === team.slug) {
        chapter.organizers = team.members
      }
    })
    if (!chapter.organizers) {
      throw new Error('For some reason we have the chapter ' + chapter.name + ' without a team that matches ' + teams.map(function (team) {
        return team.slug
      }) + ', this shouldn\'t be as we fetched the chapters according to the teams')
    }
  })
  log.verbose('list', 'All chapters are: ', chapters)
  return chapters
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
  downloadTeamsJson: downloadTeamsJson,
  mergeChaptersAndTeams: mergeChaptersAndTeams,
  run: function (input) {
    var self = this
    return self.downloadTeamsJson()
      .then(function (teams) {
        return self.downloadChapters(input, teams.map(function (team) {
          return team.slug
        }))
        .then(function (chapters) {
          return self.mergeChaptersAndTeams(chapters, teams)
        })
      })
  }
}
