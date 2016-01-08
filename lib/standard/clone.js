var log = require('npmlog')
var path = require('path')
var inquire = require('../util/inquire')
module.exports = {
    description: 'Clones the specified chapter into the path (path defaults to the name of the chapter)'
  , run: function (input, gitExec) {
      return Promise.resolve(input.chapter || input.argv.remain[1])
        .then(function (chapter) {
          if (!chapter) {
            return inquire({name: 'chapter', message: 'Which chapter should be cloned?', type: 'input'})
              .then(function (result) {
                if (!result.chapter) {
                  return Promise.reject({
                    type: 'chapter',
                    message: 'No chapter selected.'
                  })
                }
                return result.chapter.toLowerCase()
              })
          }
          return chapter
        })
        .then(function (chapter) {
          var targetPath = path.join(input.path, chapter)
          log.info('Trying to clone ' + chapter + ' into folder ' + targetPath)
          return gitExec('clone', 'git@github.com:nodeschool/' + chapter + '.git', chapter)
            .then(function () {
              log.info('hurray', 'Successfully cloned to ' + targetPath)
            })
        })
    }
}