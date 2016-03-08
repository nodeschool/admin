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
        if (complex) {
          return resolve({
            data: null,
            response: res,
            links: []
          })
        } else {
          return resolve(null)
        }
      }
      res.pipe(require('callback-stream')(function (err, data) {
        if (err) {
          throw err
        }
        data = data.reduce(function (result, part) {
          return result + part.toString()
        }, '')
        toJson(url, data, function (err, result) {
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
