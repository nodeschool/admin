var path = require('path')
var fs = require('fs')

module.exports = {
  description: 'Init the current chapter repo.',
  help: function () {
    return fs.readFileSync(path.resolve(__dirname, 'init.help'), 'utf8')
  },
  helpPath: 'lib/chapter/init.help',
  run: function (input, remote) {
    var repoUtil = require('../util/repo')
    var inquire = require('../util/inquire')
    var save = require('../util/fs').save
    var log = require('npmlog')
    var commitLog = []

    function originalChapterUrl (chapter) {
      return 'https://raw.githubusercontent.com/nodeschool/nodeschool.github.io/source/chapters/' + chapter + '.json'
    }

    function ensureEventsJson (input) {
      var eventsJsonPath = path.join(input.path, 'events.json')
      return require('../util/json').read(eventsJsonPath, true).then(function (json) {
        if (!json) {
          commitLog.push('Created blank `events.json`.')
          return save(eventsJsonPath, '{\n}')
        }
        return json
      })
    }

    function ensureChapterJson (remote, input) {
      var chapter = input.chapter
      var jsonPath = path.join(input.path, 'chapter.json')
      var proposedName = chapter.charAt(0).toUpperCase() + chapter.substr(1)
      return require('../util/json').read(jsonPath, true)
        .then(function (json) {
          if (!json) {
            return require('../util/json').fromUrl(input, originalChapterUrl(chapter))
              .then(function (originalChapter) {
                log.verbose('json', 'Found original data:\n' + JSON.stringify(originalChapter, null, 2))
                commitLog.push('Reused previous data from website to create `chapter.json`.')
                return Promise.resolve({
                  location: {
                    name: originalChapter.location,
                    country: originalChapter.country
                  },
                  twitter: originalChapter.twitter
                })
              })
              .catch(function (err) {
                log.verbose('json', 'Error while trying to access legacy chapter url', err)
                commitLog.push('Created `chapter.json`.')
                return Promise.resolve({})
              })
          }
          return Promise.resolve(json)
        })
        .then(function (json) {
          if (!json.name) {
            return inquire.run({name: 'name', message: 'There is no "name" in the chapter.json. What name should we use?', default: proposedName, type: 'input'})
              .then(function (result) {
                if (result.name) {
                  json.name = result.name
                  commitLog.push('Added `name` to `chapter.json`.')
                  return json
                }
                return Promise.reject({
                  type: 'json',
                  message: 'Name is required'
                })
              })
          }
          return json
        })
        .then(function (json) {
          if (!json.location) {
            json.location = {}
          }
          if (!json.location.name) {
            return inquire.run({name: 'location_name', message: 'There is no "location.name" in the chapter.json. What name should we use?', default: proposedName, type: 'input'})
              .then(function (result) {
                if (result.location_name) {
                  json.location.name = result.location_name
                  commitLog.push('Added `location.name` to `chapter.json`.')
                }
                return json
              })
          }
          return json
        })
        .then(function (json) {
          if (!json.location.country && json.location.name) {
            return require('../util/geocode').country(json.location.name, 'current chapter.json')
              .then(function (country) {
                return inquire.run({name: 'ok', message: json.location.name + ' seems to be in "' + country.long_name + '". Should "' + country.short_name + ' be used as country?', type: 'confirm'})
                  .then(function (result) {
                    if (result.ok) {
                      json.location.country = country.short_name
                      commitLog.push('Added `location.country` to `chapter.json` through google api result.')
                    }
                    return json
                  })
              })
          }
          return json
        })
        .then(function (json) {
          if (!json.twitter) {
            var proposedHashtag = '#nodeschool-' + chapter
            return inquire.run({name: 'hashtag', message: 'There is no "twitter" hashtag in the chapter.json. What tag should we use?', default: proposedHashtag, type: 'input'})
              .then(function (result) {
                if (result.hashtag) {
                  json.twitter = result.hashtag
                  commitLog.push('Added `twitter` hastag to `chapter.json`.')
                }
                return json
              })
          }
          return json
        })
        .then(function (json) {
          if (json.location && json.location.name && json.location.country && !(json.location.lat || json.location.lng)) {
            var location = json.location.name + ', ' + json.location.country
            return require('../util/geocode')
              .latlng(location, json.location.name)
              .then(function (geo) {
                return inquire.run({name: 'ok', message: 'We found the position ' + geo.lat + '/' + geo.lng + ' (lat/lng) for the location ' + location + '. Is this position okay?', type: 'confirm'})
                  .then(function (result) {
                    if (result.ok) {
                      json.location.lat = geo.lat
                      json.location.lng = geo.lng
                      commitLog.push('Added `location.lat/lng` to `chapter.json` from results presented by google.')
                      return json
                    } else {
                      return inquire.run([
                        { name: 'lat', message: 'Please enter the LATITUDE of ' + location + ' (number between 90 and -90)', type: 'input', validate: function (input) {
                          return !isNaN(parseFloat(input)) && input < 90 && input > -90
                        }},
                        {name: 'lng', message: 'Please enter the LONGITUDE of ' + location + ' (number between 180 and -180)', type: 'input', validate: function (input) {
                          return !isNaN(parseFloat(input)) && input < 180 && input > -180
                        }}
                      ]).then(function (result) {
                        if (result.lat && result.lng) {
                          json.location.lat = result.lat
                          json.location.lng = result.lng
                          commitLog.push('Added `location.lat/lng` to `chapter.json`.')
                          return json
                        }
                        return Promise.reject({
                          type: 'geojson',
                          message: 'We need the location of the chapter for pins on our map.'
                        })
                      })
                    }
                  })
              })
          }
          return json
        })
        .then(function (json) {
          return save(jsonPath, JSON.stringify(json, null, 2))
        })
    }

    function ensureTravisYml (input) {
      var ymlPath = path.resolve(input.path, '.travis.yml')
      return new Promise(function (resolve, reject) {
        fs.access(ymlPath, function (err, data) {
          if (err) {
            log.silly('travis', 'Seems like the .travis.yml doesnt exist: ' + err)
            log.info('travis', 'Creating .travis.yml file (internal: v1)')
            commitLog.push('Created `.travis.yml`.')
            resolve(save(ymlPath,
              'language: nodejs\n' +
              'node_js:\n' +
              '  - "stable"\n' +
              '  - "0.12"\n' +
              '  - "0.10"\n' +
              'git:\n' +
              '  depth: 3\n' +
              'before_script:\n' +
              '  – npm i nodeschool-chapter -g\n' +
              'script: nodeschool-chapter test\n'
            ))
          }
          log.verbose('travis', '.travis.yml found. Assuming its the right one.')
          resolve()
        })
      })
    }
    console.log(
      '\n\n' +
      '  This tool will make sure that your chapter repository\n' +
      '  has a proper gh-pages path and a chapter.json, events.json and .travis.yml file.\n' +
      '  after the creation it will push the files to the server.\n' +
      '  (Note: all those tasks can be done by hand, this is just more comfortable)\n\n'
    )
    return inquire.run({name: 'ok', message: 'Should we start?', type: 'confirm'})
      .then(function (result) {
        if (!result.ok) {
          return Promise.reject({
            type: 'user',
            message: 'Cancelled by user request.'
          })
        }
      })
      .then(function () {
        return repoUtil.clean(remote, input.branch, ['chapter.json', 'events.json', '.travis.yml'])
      })
      .then(function () {
        return ensureChapterJson(remote, input)
      })
      .then(function () {
        return ensureEventsJson(input)
      })
      .then(function () {
        return ensureTravisYml(input)
      })
      .then(function () {
        return require('./lint').run(input, remote)
      })
      .then(function () {
        var commitMessage = 'Changes by nodeschool-chapter script: \n'
        commitMessage += commitLog.map(function (line) {
          return ' - ' + line
        }).join('\n')
        return repoUtil.commitAndPushChanges(remote, input.branch, commitMessage)
      })
  }
}
