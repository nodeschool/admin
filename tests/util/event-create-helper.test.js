/* global it describe */
var chai = require('chai')
var expect = chai.expect
var eventCreate = require('../../lib/util/event-create-helper')

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
describe('Event Create Helper', () => {
  describe('loaders', () => {
    it('should try to load chapter', () => {
      // nothing on that path
      return expect(eventCreate.loadChapter('chapter.json'))
              .to.be.rejected
    })
    it('should load chapter', () => {
      return expect(eventCreate.loadChapter('tests/chapter.json'))
              .to.eventually.have.all.keys('location', 'name', 'region', 'twitter')
    })
  })
  describe('Lat Lng check', () => {
    it('should assert Lat Lng', () => {
      var raw = '45.81444/15.97798'
      return expect(eventCreate.assertLatLng(raw)).to.equal(true)
    })
    it('should assert Lat Lng with wrong formating', () => {
      var raw = '45,81444/15,97798'
      return expect(eventCreate.assertLatLng(raw)).to.equal('Invalid formatting.')
    })
    it('should assert Lat Lng with wrong formating#2', () => {
      var raw = '45,81444'
      return expect(eventCreate.assertLatLng(raw)).to.equal('Invalid formatting.')
    })
    it('should assert Lat Lng with wrong formating#3', () => {
      var raw = '45,81444/d'
      return expect(eventCreate.assertLatLng(raw)).to.equal('Invalid formatting.')
    })
    it('should assert Lat Lng with wrong Latitude', () => {
      var raw = '100.81444/15.97798'
      return expect(eventCreate.assertLatLng(raw)).to.equal('Latitude has to be smaller or equal 90.')
    })
    it('should assert Lat Lng with wrong Latitude#2', () => {
      var raw = '-100.81444/15.97798'
      return expect(eventCreate.assertLatLng(raw)).to.equal('Latitude has to be bigger or equal -90.')
    })
    it('should assert Lat Lng with wrong Longitude', () => {
      var raw = '45.81444/181.97798'
      return expect(eventCreate.assertLatLng(raw)).to.equal('Longitude has to be smaller or equal 180.')
    })
    it('should assert Lat Lng with wrong Longitude', () => {
      var raw = '45.81444/-181.97798'
      return expect(eventCreate.assertLatLng(raw)).to.equal('Longitude has to be bigger or equal -180.')
    })
  })

  describe('Questions', () => {
    var events = {
      'NodeSchool Zagreb Kick-Off': {
        location: { lat: 45.81444, lng: 15.97798, name: 'MaMa' },
        startTime: '10:00',
        startDate: '01.03.1991',
        endTime: '10:00',
        endDate: '03.03.1991',
        url: 'http://jszgb.com'
      },
      'NodeSchool Zagreb #2': {
        location: { lat: 45.81444, lng: 15.97798, name: 'MaMa' },
        startTime: '19:00',
        startDate: '03.03.1990',
        endTime: '10:00',
        endDate: '04.05.1990',
        url: 'http://jszgb.com' }
    }
    var sug = {
      suggestions: {
        eventCount: 2,
        commonPrefix: '',
        usualStartTime: undefined,
        usualEndTime: undefined,
        nextSameWeekday: undefined,
        events: [{}, {}],
        locations: [{name: 'NodeSchool Zagreb Kick-Off'}]
      },
      locationMap: {
        MaMa: { name: 'NodeSchool Zagreb #2', data: [{}] }
      }
    }
    var locations = sug.suggestions.locations.map(function (location) {
      return location.name
    })

    it('should generate empty suggestions', () => {
      var ev = {}
      return expect(eventCreate.generateSugestions(ev)).to.have.all.keys('suggestions', 'locationMap')
              .and.to.have.deep.property('suggestions.eventCount', 0)
    })
    it('should generate suggestions and check suggestions', () => {
      return expect(eventCreate.generateSugestions(events)).to.have.all.keys('suggestions', 'locationMap')
              .and.to.have.deep.property('suggestions.eventCount', 2)
    })
    it('should generate suggestions and check locaitonMap', () => {
      return expect(eventCreate.generateSugestions(events)).and.to.have.deep.property('locationMap.MaMa')
    })
    it('should ask for url', () => {
      return expect(eventCreate.askForUrl).to.have.all.keys('name', 'message', 'type', 'validate')
    })
    it('should ask for name', () => {
      return expect(eventCreate.askForName({}, sug.suggestions, sug.locationMap)).to.have.all.keys('name', 'message', 'type', 'default', 'validate')
              .and.to.have.property('name', 'name')
    })
    it('should ask for name and validate if name is taken', () => {
      var name = eventCreate.askForName({}, sug.suggestions, locations)
      return expect(name.validate('NodeSchool Zagreb Kick-Off')).to.equal('Name is already taken!')
    })
    it('should ask for location', () => {
      return expect(eventCreate.askForLocation({}, locations)).to.have.all.keys('name', 'message', 'type', 'choices', 'when')
              .and.to.have.property('name', 'location-name')
    })
    it('should ask for location name', () => {
      return expect(eventCreate.askForLocationName({}, locations)).to.have.all.keys('name', 'message', 'default', 'validate', 'when')
              .and.to.have.property('name', 'newLocation.name')
    })
    it('should ask for location position', () => {
      return expect(eventCreate.askForPosition({}, locations)).to.have.all.keys('name', 'message', 'default', 'validate')
              .and.to.have.property('name', 'newLocation.latLng')
    })
    it('should ask for open date', () => {
      return expect(eventCreate.askForOpenDate({}, sug.suggestions)).to.have.all.keys('name', 'message', 'default', 'type', 'validate')
              .and.to.have.property('name', 'openDate')
    })
    it('should ask for open time', () => {
      return expect(eventCreate.askForOpenTime({}, sug.suggestions)).to.have.all.keys('name', 'message', 'default', 'type', 'validate')
              .and.to.have.property('name', 'openTime')
    })
    it('should ask for end date', () => {
      return expect(eventCreate.askForEndDate()).to.have.all.keys('name', 'message', 'default', 'type', 'validate')
              .and.to.have.property('name', 'endDate')
    })
    it('should ask for end time', () => {
      return expect(eventCreate.askForEndTime()).to.have.all.keys('name', 'message', 'default', 'type', 'validate')
              .and.to.have.property('name', 'endTime')
    })
  })

  describe('Events', () => {
    var eve = {
      url: 'http://jszgb.com',
      name: 'NodeSchool Zagreb #3',
      'location-name': 'MaMa',
      'newLocation.latLng': '45.81444/15.97798',
      openDate: '10.06.2016',
      openTime: '10:00',
      endDate: '11.06.2016',
      endTime: '10:00',
      contact: 'node@school.com'
    }

    it('should generate events and check their properties', () => {
      var e = eventCreate.generateEvent(eve)
      return expect(e)
              .to.have.all.keys('location', 'name', 'endTime', 'endDate', 'url', 'contact')
    })

    it('should generate events without location', () => {
      var ev = eve
      ev.location = undefined
      var e = eventCreate.generateEvent(ev)
      expect(e)
              .and.to.have.deep.property('location.place', 'MaMa')
      expect(e)
              .and.to.have.deep.property('location.lat', 45.81444)
      expect(e)
              .and.to.have.deep.property('location.lng', 15.97798)
    })
  })
})
