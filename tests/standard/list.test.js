var List = require('../../lib/standard/list')
var Json = require('../../lib/util/json')
var Validate = require('../../lib/util/validate')
var sinon = require('sinon')
var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('Standard List', () => {
  var sandbox
  var input = {
    argv: { remain: [], cooked: [], original: [] },
    chapter: 'zagreb',
    branch: 'gh-pages'
  }
  var team = {
    slug: 'zagreb',
    name: 'Zagreb',
    members: [],
    repos: [{
      name: 'zagreb'
    }]
  }
  var events
  var chapterRaw
  var chapter

  beforeEach(function () {
    events = {'a': {
      location: {
        name: 'Fashion house',
        lat: 20,
        lng: 20
      },
      startDate: '2016/02/12',
      startTime: '20:30',
      endDate: '2016/02/12',
      endTime: '22:30',
      contact: {
        email: 'm@m.com'
      },
      url: 'https://nodeschool.io'
    }}
    chapterRaw = {
      name: 'NodeSchool Zagreb',
      location: {
        name: 'Zagreb',
        country: 'HR',
        lat: 22,
        lng: 33
      },
      twitter: '#nodeschool-zagreb'
    }
    chapter = Object.assign({
      region: 'Europe',
      slug: 'zagreb',
      events: {},
      repo: 'https://github.com/nodeschool/zagreb',
      website: 'https://nodeschool.io/zagreb'
    }, chapterRaw)
    sandbox = sinon.sandbox.create()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('should get all the repos with new structure', () => {
    sandbox.stub(Json, 'fromUrl', function () {
      return new Promise(resolve => {
        resolve([team])
      })
    })
    sandbox.stub(Validate, 'chapter', function () {
      return new Promise(resolve => {
        resolve(true)
      })
    })
    sandbox.stub(Validate, 'events', function () {
      return new Promise(resolve => {
        resolve(true)
      })
    })
    sandbox.stub(List, 'downloadChapters', function () {
      return new Promise(resolve => {
        resolve([chapter])
      })
    })
    return List.run(input).then(chapters => {
      var zagreb = chapters.find(function (chapter) {
        return chapter.name === 'NodeSchool Zagreb'
      })
      return expect(zagreb.twitter).to.equal('#nodeschool-zagreb')
    })
  })

  it('should download the details of all chapters', () => {
    sandbox.stub(List, 'downloadChapter', function () {
      return new Promise(resolve => {
        resolve(chapter)
      })
    })
    return List.downloadChapters({}, ['zagreb']).then(chapters => {
      return expect(chapters[0])
              .to.be.deep.equals(chapter)
    })
  })

  it('should download the events of a chapters', () => {
    sandbox.stub(List, 'downloadChapterJson', function () {
      return new Promise(resolve => {
        resolve(chapterRaw)
      })
    })
    sandbox.stub(Json, 'fromUrl', function () {
      return new Promise(resolve => {
        resolve(events)
      })
    })
    return List.downloadChapter({}, 'zagreb').then(zagreb => {
      return expect(zagreb.events)
              .to.be.deep.equals(events)
    })
  })

  it('should download a chapter', () => {
    sandbox.stub(Json, 'fromUrl', function () {
      return new Promise(resolve => {
        resolve(chapterRaw)
      })
    })
    sandbox.stub(List, 'downloadEventsJson', function () {
      return new Promise(resolve => {
        resolve({})
      })
    })
    return List.downloadChapter({}, 'zagreb').then(zagreb => {
      return expect(zagreb)
              .to.be.deep.equals(chapter)
    })
  })

  it('should check chapter timezone', () => {
    sandbox.stub(List, 'downloadChapters', function () {
      return new Promise(resolve => {
        resolve([chapter])
      })
    })
    sandbox.stub(List, 'downloadChapterJson', function () {
      return new Promise(resolve => {
        resolve(chapter)
      })
    })
    sandbox.stub(List, 'downloadEventsJson', function () {
      return new Promise(resolve => {
        resolve({})
      })
    })
    return List.downloadChapter({}, 'zagreb').then(chapter => {
      return expect(chapter)
              .to.have.deep.property('location.timezone', 'Africa/Khartoum')
    })
  })
})
