var Git = require('nodegit')
var path = require('path')
var fs = require('fs')
var os = require('os')
var root = (os.platform == 'win32') ? process.cwd().split(path.sep)[0] : '/'
var util = require('util')
var log = require('npmlog')
var gitUrlParse = require('git-url-parse')
var inquirer = require('inquirer')

function checkGitVersion (path, nr) {
  return createGitExec(path)('version').then(function (data) {
    var version = /^git version ([0-9]+\.[0-9]+\.[0-9]+)/.exec(data)
    if (version && require('semver-compare')(version[1], nr) === 1)
      return Promise.resolve(version[1])

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

function runMethod (mode, input, remote) {
  if (!input.path) {
    input.path = process.cwd()
  }
  input.branch = 'gh-pages'

  var cmd = mode[input.argv.remain[0]]
  if (!cmd) {
    var commands = Object.keys(mode)
    var maxLength = commands.reduce(function (maxLength, entry) {
      return (entry.length > maxLength) ? entry.length : maxLength
    }, 0)
    return new Promise(function (resolve, reject) {
      inquirer.prompt([
        {
          name: 'cmd',
          message: 'What do you want to do?',
          type: 'list',
          choices: commands.map(function (key) {
            var cmd = mode[key]
            return {
              name: key + ' ' + new Array(maxLength - key.length + 1).join('.') + '... ' + cmd.description,
              value: key,
              short: key
            }
          })
        }
      ], function (result) {
        input.argv.remain.splice(0, 0, result.cmd)
        resolve(input)
      })
    }).then(function () {
      return runMethod(mode, input, remote)
    })
  }
  return cmd.run(input, remote)
}

var mode = {
  chapter: require('./chapter'),   standard: require('./standard')
}

function runStandard (input, err) {
  log.info('mode', 'standard')
  return runMethod(mode.standard, input, createGitExec(input.path))
}

function runChapter (input, remote) {
  log.info('mode', 'chapter', '#' + remote.gitUrl.name)
  input.chapter = input.chapter || remote.gitUrl.name
  return runMethod(mode.chapter, input, remote)
}

module.exports = {
  log: log,
  getRemote: getRemote,
  runChapter: runChapter,
  runStandard: runStandard,
  run: function (input) {
    return getRemote(input.path)
      .then(function (remote) {
        if (!remote) {
          return runStandard(input)
        }
        return runChapter(input, remote)
      })
  },
  mode: mode
}
