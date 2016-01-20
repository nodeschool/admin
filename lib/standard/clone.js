var log = require('npmlog')
var path = require('path')
var fs = require('fs')
var inquire = require('../util/inquire')

function selectChapter (chapter) {
  if (!chapter) {
    return inquire.run({name: 'chapter', message: 'Which chapter should be cloned?', type: 'input'})
      .then(function (result) {
        if (!result.chapter) {
          return Promise.reject({
            type: 'user',
            message: 'No chapter selected.'
          })
        }
        return result.chapter.toLowerCase()
      })
  }
  return chapter
}

function cloneChapter (input, gitExec, chapter) {
  var targetPath = path.join(input.path, chapter)
  log.info('Trying to clone ' + chapter + ' into folder ' + targetPath)
  return gitExec('clone', 'git@github.com:nodeschool/' + chapter + '.git', chapter)
    .then(function () {
      log.info('hurray', 'Successfully cloned to ' + targetPath)
    })
}

module.exports = {
  description: 'Clone a chapter.',
  help: function () {
    return fs.readFileSync(path.resolve(__dirname, 'clone.help'), 'utf8')
  },
  helpPath: 'lib/standard/clone.help',
  selectChapter: selectChapter,
  cloneChapter: cloneChapter,
  run: function (input, gitExec) {
    var self = this
    return Promise.resolve(input.chapter || input.argv.remain[1] || '')
      .then(selectChapter)
      .then(function (chapter) {
        return self.cloneChapter(input, gitExec, chapter)
      })
  }
}
