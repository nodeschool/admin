var log = require('npmlog')
var fs = require('fs')
var util = require('util')

function toJson (path, data, cb) {
  var json
  try {
    json = JSON.parse(data)
  } catch (e) {
    cb(e)
  }
  cb(null, json)
}

exports.read = function readJson (path, silent) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, function (err, data) {
      if (err) {
        if (silent) {
          log.verbose('json', 'Error trying to access ' + path + ', assuming it doesnt exist. Error was: ' + (err.stack || err))
          resolve()
        } else {
          reject(err)
        }
      } else {
        resolve(data)
      }
    })
  }).then(function (data) {
    return new Promise(function (resolve, reject) {
        toJson(path, data, function (err, result) {
          err ? Promise.reject({
            type: 'json',
            message: '`' + path + '` exists but does not contain valid json data.\n' + err
          }) : resolve(result)
        })
      })
  })
}

exports.fromUrl = function jsonFromUrl (input, url, opts, complex) {
  if (!opts) {
    opts = {}
  }
  if (!opts.headers) {
    opts.headers = {}
  }
  if (!opts.headers['User-Agent']) {
    log.silly('json', 'Adding missing user agent.')
    opts.headers['User-Agent'] = 'CLI tool: nodeschool-chapter'
  }
  var isGithub = /^https?\:\/\/api\.github\.com\//.test(url)
  var ghToken
  var ghClient
  if (isGithub) {
    log.silly('json', url + ' is a github url')
    ghToken = input['gh-token']
    if (ghToken) {
      log.silly('json', 'Using token ' + ghToken)
      opts.headers['Authorization'] = 'token ' + ghToken
    } else {
      ghClient = {
        id: input['gh-client-id'],
        secret: input['gh-client-secret']
      }
      if (ghClient.id && ghClient.secret) {
        log.silly('json', 'Using Client\n' + util.inspect(ghClient))
        url += (/\?/.test(url) ? '&' : '?') + 'client_id=' + encodeURIComponent(ghClient.id) + '&client_secret=' + encodeURIComponent(ghClient.secret)
      } else {
        log.silly('json', '... and we have no authentication')
      }
    }
  }

  return new Promise(function (resolve, reject) {
    var hyperquest = require('hyperquest')
    log.silly('json', 'Loading ' + url)
    log.silly('json', util.inspect(opts))
    hyperquest(url, opts, function (err, res) {
      if (err) {
        return reject({
          type: 'json',
          message: err
        })
      }
      if (res.statusCode === 404) {
        if (complex)
          return resolve({
            data: null,
            response: res,
            links: []
          })
        else {
          return resolve(null)
        }
      }
      if (isGithub && res.headers['x-ratelimit-remaining'] === '0') {
        if (ghToken) {
          return reject({
            type: 'github',
            message: 'Seems like you have reached a hard API Ratelimit at github, no quota remaining.'
          })
        } else if (ghClient) {
          return reject({
            type: 'github',
            message: 'API Ratelimit reached! Maybe using a GITHUB_TOKEN will help? https://github.com/settings/tokens'
          })
        } else {
          return reject({
            type: 'github',
            message: 'API Ratelimit reached!\n'
                   + 'You will need to specify an github API authentication to get to the data.\nYou can specify it by providing an environment variable GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET or pass in a GITHUB_TOKEN (for more permissions).\n'
                   + 'Alternatively you can also call this command with the --gh-client-id and --gh-client-secret or --gh-token.\n'
                   + 'Get a client_id & client_secret here: https://github.com/settings/developers\n'
                   + 'Get a token here: https://github.com/settings/tokens'
          })
        }
      }
      res.pipe(require('callback-stream')(function (err, data) {
        data = data.reduce(function (result, part) {
          return result + part.toString()
        }, '')
        toJson(url, data,  function (err, result) {
          err ? reject(err) : resolve(!complex ? result : {
            data: result,
            response: res,
            links: res.headers.link ? res.headers.link.split(/\s*,\s*/).reduce(function (links, url) {
              var parts = /^\s*\<([^\>]+)\>\s*;\s*rel\s*=\s*\"([^\"]*)\"/.exec(url)
              links[parts[2]] = parts[1]
              return links
            }, {}) : {}
          })
        })
      }))
    })
  })
}
