var log = require('npmlog')
var fs = require('fs')

function toJson (path, data, resolve, reject) {
  var json
  try {
    json = JSON.parse(data)
  } catch (e) {
    log.verbose('json', 'The `' + path + '` file is not valid json: ' + e)
    log.verbose('json', data)
    return reject(e)
  }
  resolve(json)
}

exports.read = function readJson (path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, function (err, data) {
      if (err) {
        log.verbose('json', 'Error trying to access ' + path + ', assuming it doesnt exist. Error was: ' + (err.stack || err))
        resolve()
      } else {
        toJson(path, data, resolve, reject)
      }
    })
  }).catch(function (e) {
    return Promise.reject({
      type: 'json',
      message: '`' + jsonPath + '` exists and does not contain valid json data.'
    })
  })
}

exports.fromUrl = function jsonFromUrl (url) {
  return new Promise(function (resolve, reject) {
    var hyperquest = require('hyperquest')
    hyperquest(url, {}, function (err, res) {
      if (res.statusCode === 404) {
        resolve()
      } else {
        res.pipe(require('callback-stream')(function (err, data) {
          data = data.reduce(function (result, part) {
            return result + part.toString()
          }, '')
          toJson(url, data, resolve, reject)
        }))
      }
    })
  })
}
