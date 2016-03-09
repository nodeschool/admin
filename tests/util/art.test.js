var Art = require('../../lib/util/art')
var chai = require('chai')
var expect = chai.expect
var fs = require('fs')
var path = require('path')

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

function artEquals(name, columns, file) {
  expect(Art.logoWithText(name, columns)).to.equal(fs.readFileSync(path.join(__dirname, file), 'utf8'))
}

describe('Utils Art', () => {
  it('should print the artwork for newyork', () => {
    return artEquals(
      'newyork',
      undefined,
      'art_80_newyork.txt')
  })
  it('should print the artwork for osaka', () => {
    return artEquals(
      'osaka',
      undefined,
      'art_80_osaka.txt')
  })
  it('should print the artwork for newyork on size 60', () => {
    return artEquals(
      'newyork',
      60,
      'art_60_newyork.txt')
  })
  it('should print the artwork for newyork on size 120', () => {
    return artEquals(
      'osaka',
      120,
      'art_120_osaka.txt')
  })
})
