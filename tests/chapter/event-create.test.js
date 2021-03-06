/* global it describe beforeEach afterEach */

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var eventCreate = require('../../lib/chapter/event-create')

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

var repoUtil = require('../../lib/util/repo')
var inquire = require('../../lib/util/inquire')
var fs = require('../../lib/util/fs')
var eventCreateHelper = require('../../lib/util/event-create-helper')
var events = require('../events.json')
var chapter = require('../chapter.json')

describe('Event Create', () => {
  var sandbox
  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    sandbox.stub(repoUtil, 'clean', () => {
      return new Promise(resolve => {
        resolve(true)
      })
    })
    sandbox.stub(eventCreateHelper, 'loadChapter', () => {
      return new Promise(resolve => {
        resolve(chapter)
      })
    })
    sandbox.stub(eventCreateHelper, 'loadEvents', () => {
      return new Promise(resolve => {
        resolve(events)
      })
    })
    sandbox.stub(inquire, 'run', () => {
      return new Promise(resolve => {
        resolve({
          url: 'http://jszgb.com',
          name: 'NodeSchool Zagreb #5',
          'location-name': 'MaMa',
          'newLocation.latLng': '45.81444/15.97798',
          startDate: '10.03.2017',
          startTime: '10:00',
          endDate: '20.03.2019',
          endTime: '10:00'
        })
      })
    })
    sandbox.stub(fs, 'save', () => {
      return new Promise(resolve => {
        resolve({
          type: 'fs',
          message: 'saved'
        })
      })
    })
  })
  afterEach(() => {
    sandbox.restore()
  })
  it('should run', () => {
    return expect(eventCreate.run({path: '/'}, {}))
            .to.eventually.have.all.keys('message', 'type')
  })
})
