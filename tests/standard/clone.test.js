var Clone = require('../../lib/standard/clone')
var Inquire = require('../../lib/util/inquire')
var sinon = require('sinon')
var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('Standard Clone', () => {
  var sandbox
  var input = {
    argv: { remain: [], cooked: [], original: [] },
    chapter: 'Zagreb',
    branch: 'gh-pages',
    path: 'path'
  }
  beforeEach(function () {
    sandbox = sinon.sandbox.create()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('should select a chapter to clone with selected value', () => {
    var chapter = {chapter: 'stanford'}
    return expect(Clone.selectChapter(chapter)).to.equal(chapter)
  })

  it('should select a chapter to clone without a value #1', () => {
    sandbox.stub(Inquire, 'run', () => {
      return new Promise(function (resolve) {
        resolve(input)
      })
    })
    return expect(Clone.selectChapter()).to.eventually.become('zagreb')
  })

  it('should select a chapter to clone without a value #2', () => {
    sandbox.stub(Inquire, 'run', () => {
      return new Promise(function (resolve) {
        resolve({})
      })
    })
    return expect(Clone.selectChapter()).to.be.rejected
  })

  it('should clone the chapter', () => {
    sandbox.stub(Clone, 'cloneChapter', (input, gitExec, chapter) => {
      return new Promise(function (resolve) {
        resolve(chapter)
      })
    })
    return expect(Clone.run(input, () => {})).to.eventually.equal('Zagreb')
  })
})
