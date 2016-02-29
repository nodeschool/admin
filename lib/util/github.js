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

exports.getOrganizers = function () {
  log.verbose('github', 'Looking for github organizers')
  var url = 'http://team.nodeschool.io/teams.json'
  return json.fromUrl({}, url).then(function (organizers) {
    log.verbose('github', 'Got github organizers from ' + url)
    return organizers
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
