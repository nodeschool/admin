var GITHUB = 'https://api.github.com/'
var json = require('./json')
var log = require('npmlog')

function getList (input, href, opts, all) {
  log.verbose('github', 'Loading url: ' + href)
  return json.fromUrl(input, href, opts, true)
    .then(function (result) {
      if (!result) {
        return Promise.reject({
          type: 'github',
          message: href + ' returned an empty result.'
        })
      }
      var next = result.links && result.links.next
      if (result.data && Array.isArray(result.data)) {
        all = all.concat(result.data)
      }
      if (next) {
        return getList(input, next, opts, all)
      }
      return all
    })
}
function one (input, method, opts) {
  return json.fromUrl(input, GITHUB + method, opts)
}

exports.teamMembers = function (input, org, whiteList) {
  log.verbose('github', 'Looking for teams of organization "' + org + '".')
  if (whiteList) {
    log.verbose('github', 'Applying whitelist: ' + whiteList)
  }
  return this.all(input, 'orgs/' + org + '/teams')
    .then(function (list) {
      return list.reduce(function (map, entry) {
        if (whiteList.indexOf(entry.name) !== -1) {
          map[entry.name] = entry.id
        } else {
          log.verbose('github', 'Ignoring ' + entry.name + ' because its not in whitelist.')
        }
        return map
      }, {})
    })
    .then(function (teamMap) {
      var all = {}
      var keys = Object.keys(teamMap)
      log.verbose('github', 'Found ' + keys.length + ' teams.')
      log.verbose('github', 'Fetching team members.')

      return require('bluebird').each(keys, function (key) {
        return one(input, 'teams/' + teamMap[key] + '/members')
          .then(function (teamMembers) {
            log.verbose('github', 'Fetching team members.')
            all[key] = teamMembers.map(function (teamMember) {
              return {
                login: teamMember.login,
                avatar_url: teamMember.avatar_url
              }
            })
          })
          .catch(function (e) {
            log.verbose('github', 'Error while fetching ' + org + ' memmbers.\n' + e.stack)
          })
      }).then(function () {
        return all
      })
    })
}

exports.one = one

exports.all = function (input, method, opts) {
  return getList(input, GITHUB + method, opts, [])
}
/*
exports.createAuthorization = function (input) {
  h.post('authorizations', {
    body: JSON.stringify({
      client_id: input.client_id,
      client_secret: input.client_secret,
      note: 'Authorization for nodeschool-chapter, to access nodeschool organizational data',
      note_url: 'http://github.com/nodeschool/nodeschool-chapter',
      scopes: ['read:org']
    })
  }, function ())
}
*/
