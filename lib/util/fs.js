var log = require('npmlog')
var fs = require('fs')
exports.save = function save (path, data) {
  log.info('fs', 'Trying to write following object to path: ' + path)
  log.silly('fs', data)
  return new Promise(function (resolve, reject) {
    fs.writeFile(path, data, function (err) {
      if (err) {
        reject({
          type: 'fs',
          message: 'Error while writing ' + path + '. \n' + (err.stack || err)
        })
      } else {
        log.info('fs', 'Successfully wrote file: ' + path + '')
        resolve()
      }
    })
  })
}
