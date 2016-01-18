var github = require('../util/github')
var log = require('npmlog')
var fs = require('fs')
var path = require('path')
var util = require('util')
var ProgressBar = require('progress')

module.exports = {
  description: 'List all chapters.',
  help: function () {
    return fs.readFileSync(path.resolve(__dirname, 'list.help'), 'utf8')
  },
  helpPath: 'lib/standard/list.help',
  run: function (input) {
    var json = require('../util/json')
    var bb = require('bluebird')
    var validate = require('../util/validate')

    function getAllV2 () {
      var v2Chapters = {}
      log.info('github', 'Loading all public repos.')
      return github.all(input, 'orgs/nodeschool/repos?type=public')
        .then(function (repos) {
          log.verbose('json', 'Found ' + repos.length + ' repositories.\n')
          var bar = new ProgressBar(':percent :etas - Checking :name', { total: repos.length })
          var bb = require('bluebird')
          return bb.each(repos, function (repo) {
            bar.tick({
              'name': repo.name
            })
            var url = 'http://nodeschool.io/' + repo.name + '/chapter.json'
            return json.fromUrl(input, url)
              .catch(function (e) {})
              .then(function (data) {
                if (data) {
                  return validate.chapter(url, data)
                    .then(function () {
                      v2Chapters[repo.name] = data
                      log.verbose('json', url + ' found valid chapter ' + repo.name)
                    })
                    .catch(function (e) {
                      log.warn('json', url + ' exists but is invalid:\n' + util.inspect(e))
                    })
                }
              })
          }).then(function () {
            return v2Chapters
          })
        })
    }
    // function getAllV1(v2Chapters) {
    //   return github.all(input, 'repos/nodeschool/nodeschool.github.io/contents/chapters')
    //     .then(function (result) {
    //       if (!result) {
    //         Promise.reject({
    //           type: 'git',
    //           message: 'Seems like we were not able to access the chapterlist'
    //         })
    //       }
    //       log.info('github', 'Found ' + Object.keys(result).length + ' v1 chapters.')
    //       return bb.each(result.filter(function (item) {
    //         if (v2Chapters[item.name]) {
    //           log.silly('chapter', 'Ignoring chapter ' + item.name + ' v1')
    //           return false
    //         }
    //         return true
    //       }).map(function (item) {
    //         return item.name
    //       }), function (name) {
    //         return json.fromUrl(input, 'https://raw.githubusercontent.com/nodeschool/nodeschool.github.io/source/chapters/' + name)
    //         .then(function (data) {
    //           return v1ChapterToV2(data)
    //         })
    //         .then(function (v2Chapter) {
    //           v2Chapters[name] = v2Chapter
    //         })
    //       }).then(function (list) {
    //         return v2Chapters
    //       })
    //     })
    // }
    return getAllV2()
      .then(function (v2Chapters) {
        log.verbose('github', 'Found ' + Object.keys(v2Chapters).length + ' chapters.')
        return bb.each(Object.keys(v2Chapters), function (chapterName) {
          var url = 'http://nodeschool.io/' + chapterName + '/events.json'
          log.verbose('github', 'Looking for events for ' + chapterName + '.')
          return json.fromUrl(input, url)
            .catch(function () { /* Ignoring error */ })
            .then(function (events) {
              return validate.events(url, events)
                .then(function (events) {
                  v2Chapters[chapterName].events = events
                })
                .catch(function (e) {
                  v2Chapters[chapterName].events = []
                  log.warn('json', url + ' exists but is invalid:\n' + util.inspect(e))
                })
            })
        })
          .then(function () {
            log.verbose('github', 'Looking for team members')
            var chapterNames = Object.keys(v2Chapters)
            return github.teamMembers(input, 'nodeschool', chapterNames)
              .then(function (allMembers) {
                return chapterNames.reduce(function (v2Chapters, chapterName) {
                  v2Chapters[chapterName].organizers = allMembers[chapterName]
                  return v2Chapters
                }, v2Chapters)
              })
              .then(function (v2Chapters) {
                return JSON.stringify(v2Chapters, false, 2)
              })
          })
      })
  }
}
