var List = require('../../lib/standard/list')
var Github = require('../../lib/util/github')
var Json = require('../../lib/util/json')
var Validate = require('../../lib/util/validate')
var sinon = require('sinon')
var chai = require('chai')
var expect = chai.expect

describe('Standard List', () => {
  var sandbox
  var input = {
    argv: { remain: [], cooked: [], original: [] },
    chapter: 'zagreb',
    branch: 'gh-pages'
  }
  var chapter = {
    name: 'NodeSchool Zagreb',
    location: {
      name: 'Zagreb',
      country: 'HR',
      lat: 22,
      lng: 33
    },
    twitter: '#nodeschool-zagreb'
  }

  beforeEach(function () {
    sandbox = sinon.sandbox.create()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('should get all the repos with new structure', () => {
    sinon.stub(Github, 'all', function () {
      return new Promise(function (resolve) {
        resolve([chapter])
      })
    })
    sinon.stub(Json, 'fromUrl', function () {
      return new Promise(function (resolve) {
        resolve(chapter)
      })
    })
    sinon.stub(Validate, 'chapter', function () {
      return new Promise(function (resolve) {
        resolve(true)
      })
    })
    sinon.stub(Validate, 'events', function () {
      return new Promise(function (resolve) {
        resolve(true)
      })
    })
    return List.run(input).then(chapters => {
      var chapter = chapters['NodeSchool Zagreb']
      return expect(chapter.twitter).to.equal('#nodeschool-zagreb')
    })
  })
})
