var Git = require('nodegit')
var log = require('npmlog')
var path = require('path')
var inquire = require('./inquire')

function getStatus (remote, branchName) {
  return remote.gitExec('status', '-b', '--porcelain').then(function (result) {
    result = result.split('\n')[0]
    log.verbose('git', 'status -b --porcelain: ' + result)
    var reg = new RegExp('\\#\\# ' + branchName + '(\\.{3}([^ ]+))?( \\[([^\\]]+)\\])?')
    var remoteRes = reg.exec(result)
    return remoteRes
  })
}

function ensureUpToDateBranch (remote, branchName) {
  var expectedRemote = remote.name() + '/' + branchName
  log.verbose('git', 'Checking if branch ' + branchName + ' exists and tracks ' + expectedRemote)
  return getStatus(remote, branchName).then(function (remoteRes) {
    var message
    if (remoteRes[2] === undefined) {
      message = 'The branch ' + branchName + ' doesnt track any remote branch. To continue we need to change the path to ' + expectedRemote + '. Is it okay to do that now?'
    } else if (remoteRes[2] !== expectedRemote) {
      message = 'The branch ' + branchName + ' current tracks ' + remote + ' but we need it to track ' + expectedRemote + '. Is it okay to change that now?'
    }
    if (message) {
      return inquire.run({name: 'track', message: message, type: 'confirm'})
        .then(function (result) {
          if (!result.track) {
            return Promise.reject({
              type: 'git',
              message: 'Set the remote branch to the ' + expectedRemote + ' and try again'
            })
          }
        })
        .then(function () {
          return remote.gitExec('branch', '--set-upstream-to', branchName, expectedRemote)
            .then(function () {
              return getStatus(remote, branchName)
            })
            .then(function (remoteRes) {
              log.verbose('git', remoteRes[2])
              if (remoteRes[2] !== expectedRemote) {
                return Promise.reject({
                  type: 'git',
                  message: 'Even after tracking the remote it seems to not track properly'
                })
              }
              return remoteRes
            })
            .catch(function (e) {
              if (remoteRes[2] !== undefined) {
                return Promise.reject(e)
              }
            })
        })
    }
    return remoteRes
  }).then(function (remoteRes) {
    var state = remoteRes && remoteRes[4]
    if (/behind/.test(state)) {
      return inquire.run({name: 'track', message: 'The repo seems to be behind. Yes, to pull latest data!', type: 'confirm'})
        .then(function (result) {
          if (!result.track) {
            return Promise.reject({
              type: 'git',
              message: 'Make sure that ' + branchName + ' is up-to-date.'
            })
          } else {
            return Promise.resolve()
          }
        })
        .then(function () {
          log.verbose('git', 'Pulling latest data.')
          return remote.gitExec('pull')
        })
        .then(function (data) {
          log.verbose('git', 'Pull result: ' + data)
        })
    }
  })
}

function switchBranch (remote, branchName) {
  var repo = remote.repo
  return repo.checkoutBranch(branchName)
    .catch(function (e) {
      log.verbose('git', 'Error while trying to checkout branch ' + branchName + ': ' + e)
      return inquire.run({name: 'create', message: 'The required branch ' + branchName + ' is missing. Create it?', type: 'confirm'})
        .then(function (result) {
          if (!result.create) {
            return Promise.reject({
              type: 'git',
              message: 'Please create the branch ' + branchName + ' and try again!'
            })
          }
        })
        .then(function () {
          return repo.getHeadCommit()
        })
        .then(function (headCommit) {
          log.info('git', 'Creating branch ' + branchName + ' from commit ' + headCommit.id())
          return repo.createBranch(branchName, headCommit.id(), repo.defaultSignature(), false, 'Create gh-pages branch for github!')
        })
        .then(function () {
          return repo.checkoutBranch(branchName)
        })
    })
}

function ensureClean (repo, ignoredFiles) {
  return repo.getStatus().then(function (status) {
    status = status.filter(function (item) {
      return ignoredFiles.indexOf(item.path()) === -1
    })
    if (status.length > 0) {
      log.verbose('git', 'Found ' + status.length + ' changes in the repo.')
      return inquire.run({name: 'stash', message: 'This path contains uncommited changes.\n' + path.dirname(repo.path()) + '\n-> Should the changes be stashed?', type: 'confirm'})
        .then(function (result) {
          if (!result.stash) {
            return Promise.reject({
              type: 'git',
              message: 'Please put the current repository in a clean state!'
            })
          } else {
            log.verbose('git', 'Repository clean, no need to stash something')
          }
        })
        .then(function () {
          log.info('git', 'Stashing the current state')
          return Git.Stash.save(repo, repo.defaultSignature(), 'Stashed before nodeschool-chapter-init.', Git.Stash.APPLY_FLAGS.APPLY_DEFAULT | Git.Stash.FLAGS.INCLUDE_UNTRACKED)
        })
    } else {
      log.info('git', 'The repository is clean. Awesome!')
      return true
    }
  })
}

exports.clean = function clean (remote, branchName, ignoredFiles) {
  return ensureClean(remote.repo, ignoredFiles)
    .then(function () {
      return switchBranch(remote, branchName)
    })
    .then(function () {
      log.info('git', 'Fetching latest data from ' + remote.name() + '.')
      return remote.gitExec('fetch', remote.name())
    })
    .then(function (result) {
      log.verbose('git', 'fetch result: ' + result)
    })
    .then(function () {
      return ensureUpToDateBranch(remote, branchName)
    })
    .then(function () {
      log.info('git', 'Repository is in a fine state. Continuing.')
    })
}

exports.commitAndPushChanges = function commitAndPushChanges (remote, branchName, message) {
  var repo = remote.repo
  var oid

  return repo.getStatusExt().then(function (status) {
    if (status && status.length > 0) {
      log.info('git', 'Staging the changes.')
      log.silly('git', 'Opening index.')
      repo.openIndex().then(function (index) {
        index.read(1)
        log.silly('git', 'Adding all changes.')
        return index.addAll().then(function () {
          log.silly('git', 'Writing tree.')
          index.write()
          return index.writeTree()
        }).then(function (treeOid) {
          oid = treeOid
          log.silly('git', 'Wrote tree ' + treeOid)
          return Git.Reference.nameToId(repo, 'HEAD')
        }).then(function (head) {
          log.silly('git', 'Fetching the commit of following head ' + head)
          return repo.getCommit(head)
        }).then(function (parentCommit) {
          var author = Git.Signature.default(repo)
          var commiter = author
          log.info('git', 'Commiting the changes to HEAD with author ' + author)
          return repo.createCommit('HEAD', author, commiter, message, oid, [parentCommit])
        }).then(function () {
          return inquire.run({name: 'ok', message: 'Should the commit be pushed?', type: 'confirm'})
        }).then(function (result) {
          if (result.ok) {
            log.info('git', 'Pushing to remote: ' + remote.name())
            return remote.gitExec('push', remote.name())
          } else {
            log.info('git', 'Please push to remote!')
          }
        }).then(function () {
          // Eating eventual return message :)
        })
      })
    } else {
      log.info('git', 'Seems like nothing had to be changed. Perfect!')
    }
  })
}
