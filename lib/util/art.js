var fs = require('fs')
var path = require('path')
var chalk = require('chalk')

function maxWidth (lines) {
  return lines.reduce(function (result, line) {
    if (result > line.length) {
      return result
    }
    return line.length
  }, 0)
}

function prefix (lines, prefix) {
  return lines.map(function (line) {
    return prefix + line
  })
}

function fill (lines, width) {
  return lines.map(function (line) {
    var diff = width - line.length
    if (diff > 0) {
      return line + (new Array(diff + 1).join(' '))
    }
    return line
  })
}
var empty = /^\s*$/

function getArt (columns, art, color) {
  art = art.toString().split('\n')
  while (empty.test(art[0])) {
    art.shift()
  }
  while (empty.test(art[art.length - 1])) {
    art.pop()
  }
  art.unshift('')
  art.push('')
  var totalWidth = (columns || 80)
  var w = Math.max(maxWidth(art))
  var prefixed = (totalWidth - w) / 2 | 0
  if (prefixed > 0) {
    art = prefix(art, new Array(prefixed).join(' '))
  }
  art = fill(art, totalWidth)
  return art.map(function (line) {
    return color(line)
  })
}

function logo (columns) {
  return getArt(columns, fs.readFileSync(path.resolve(__dirname, '../../bin/nodeschool-logo.utf8.art')), chalk.bgYellow.black)
}
function text (txt, columns) {
  return getArt(columns, require('figlet').textSync(txt, {font: 'basic'}), chalk.bgBlack.white)
}
exports.logoWithText = function (txt, columns) {
  return logo(columns).concat(text(txt, columns)).concat(['\n\n']).join('\n')
}
