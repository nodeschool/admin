var github = require('../util/github')
var log = require('npmlog')
var fs = require('fs')
var path = require('path')
var util = require('util')
var ProgressBar = require('progress')
var bb = require('bluebird')

var json = require('../util/json')
var validate = require('../util/validate')

module.exports = {
  description: 'List all chapters.',
  help: function () {
    return fs.readFileSync(path.resolve(__dirname, 'list.help'), 'utf8')
  },
  helpPath: 'lib/standard/list.help',
  v2Chapters: {},
  getAllRepos: function (input) {
    var self = this
    log.info('github', 'Loading all public repos.')
    return github.all(input, 'orgs/nodeschool/repos?type=public')
      .then(function (repos) {
        log.verbose('json', 'Found ' + repos.length + ' repositories.\n')
        return self.parseRepos(repos)
      })
  },
  parseRepos: function (repos) {
    var self = this
    var bar = new ProgressBar(':percent :etas - Checking :name', { total: repos.length })
    return bb.each(repos, function (repo) {
      bar.tick({
        'name': repo.name
      })
      var url = 'http://nodeschool.io/' + repo.name + '/chapter.json'
      return json.fromUrl(self.input, url)
        .catch(function (e) {})
        .then(function (data) {
          if (data) {
            return validate.chapter(url, data)
              .then(function () {
                self.v2Chapters[repo.name] = data
                log.verbose('json', url + ' found valid chapter ' + repo.name)
              })
              .catch(function (e) {
                log.warn('json', url + ' exists but is invalid:\n' + util.inspect(e))
              })
          }
        })
    }).then(function () {
      return self.v2Chapters
    })
  },
  getEvents: function () {
    var self = this
    var v2Chapters = this.v2Chapters
    log.verbose('github', 'Found ' + Object.keys(v2Chapters).length + ' chapters.')
    return bb.each(Object.keys(v2Chapters), function (chapterName) {
      var url = 'http://nodeschool.io/' + chapterName + '/events.json'
      log.verbose('github', 'Looking for events for ' + chapterName + '.')
      return self.downloadEvents(url, chapterName).then(self.downloadTeamMembers.bind(self))
    })
  },
  downloadEvents: function (url, chapterName) {
    var self = this
    return json.fromUrl(self.input, url)
      .catch(function () { /* Ignoring error */ })
      .then(function (events) {
        return validate.events(url, events)
          .then(function (events) {
            self.v2Chapters[chapterName].events = events
          })
          .catch(function (e) {
            self.v2Chapters[chapterName].events = []
            log.warn('json', url + ' exists but is invalid:\n' + util.inspect(e))
          })
      })
  },
  downloadTeamMembers: function () {
    var self = this
    log.verbose('github', 'Looking for team members')
    var chapterNames = Object.keys(self.v2Chapters)
    console.log(chapterNames)
    return github.teamMembers(self.input, 'nodeschool', chapterNames)
      .then(function (allMembers) {
        return chapterNames.reduce(function (v2Chapters, chapterName) {
          v2Chapters[chapterName].organizers = allMembers[chapterName] || []
          return v2Chapters
        }, self.v2Chapters)
      })
      .then(function (v2Chapters) {
        return JSON.stringify(v2Chapters, false, 2)
      })
  },
  run: function (input) {
    this.input = input
    return this.getAllRepos(input).then(this.getEvents.bind(this))
  }
}
