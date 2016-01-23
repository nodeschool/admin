var Git = require('nodegit')
var path = require('path')
var os = require('os')
var root = (os.platform === 'win32') ? process.cwd().split(path.sep)[0] : '/'
var log = require('npmlog')
var gitUrlParse = require('git-url-parse')
var inquire = require('./util/inquire')

function checkGitVersion (path, nr) {
  return createGitExec(path)('version').then(function (data) {
    var version = /^git version ([0-9]+\.[0-9]+\.[0-9]+)/.exec(data)
    if (version && require('semver-compare')(version[1], nr) === 1) {
      return Promise.resolve(version[1])
    }

    return Promise.reject(version && version[1])
  })
}

function createGitExec (path) {
  return function () {
    return require('child-process-promise')
      .spawn('git', Array.prototype.slice.apply(arguments), {
        cwd: path,
        capture: ['stdout', 'stderr']
      })
      .then(function (result) {
        return Promise.resolve(result.stdout)
      })
      .catch(function (result) {
        return Promise.reject({
          type: 'git',
          message: (result && (result.stderr || result.stdout)) || result
        })
      })
  }
}

function getRemote (path) {
  return checkGitVersion(path, '2.0.0')
    .then(function (version) {
      return Git.Repository.discover(path, 1, root)
        .then(function (repoPath) {
          return Git.Repository.open(repoPath)
        })
        .then(function (repo) {
          return repo.getRemotes().then(function (remotes) {
            return {repo: repo, remotes: remotes}
          })
        })
    }, function (err) {
      log.error('Unsupported git version: ' + err + '\nMinimum git version required 2.0.0\nYou can still use the application, but we cannot asure it will behave correctly')
    })
    .catch(function () {
      return null
    })
    .then(function (data) {
      if (!data) {
        return null
      }
      return Promise.all(data.remotes.map(function (remoteName) {
        return data.repo.getRemote(remoteName).then(function (remote) {
          remote.repo = data.repo
          remote.gitUrl = gitUrlParse(remote.url())
          return remote
        })
      }))
    })
    .then(function (remotes) {
      if (!remotes) {
        return null
      }
      for (var i = 0; i < remotes.length; i++) {
        var remote = remotes[i]
        var gitUrl = remote.gitUrl
        if (gitUrl.resource === 'github.com' && gitUrl.owner === 'nodeschool') {
          remote.gitExec = createGitExec(path)
          return remote
        }
      }
      return Promise.reject({
        type: 'git',
        message: 'No appropriate remote found in ' + path
      })
    })
}

var exit = {
  description: 'Close this app.',
  run: function () {
    log.info('closing...')
  }
}

function runMethod (title, mode, input, remote) {
  if (!input.path) {
    input.path = process.cwd()
  }
  input.branch = 'gh-pages'
  var cmdName = input.argv.remain.splice(0, 1)[0]
  var cmd = mode[cmdName]
  var help = require('./help')(mode)
  if (cmdName === 'help') {
    cmd = help
  }

  if (!cmd) {
    require('./util/art').logoWithText(title)
    var allCommands = Object.assign(Object.assign({}, mode), {
      help: help,
      exit: exit
    })
    return inquire.commands(allCommands, {
      name: 'cmd',
      message: 'What do you want to do?',
      type: 'list'
    }).then(function (result) {
      return allCommands[result.cmd].run(input, remote)
    })
  }
  return cmd.run(input, remote)
}

var mode = {
  chapter: require('./chapter'),
  standard: require('./standard')
}

function runStandard (input, err) {
  return runMethod('Admin', mode.standard, input, createGitExec(input.path))
}

function runChapter (input, remote) {
  input.chapter = input.chapter || remote.gitUrl.name
  return runMethod(remote.gitUrl.name, mode.chapter, input, remote)
}

module.exports = {
  getRemote: getRemote,
  runChapter: runChapter,
  runStandard: runStandard,
  run: function (input) {
    return getRemote(input.path)
      .then(function (remote) {
        return remote ? runChapter(input, remote) : runStandard(input)
      })
  },
  mode: mode
}
