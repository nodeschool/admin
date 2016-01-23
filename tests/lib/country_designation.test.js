var CountryDesignation = require('../../lib/country_designations.js')
var chai = require('chai')
var expect = chai.expect

console.log(CountryDesignation.areas);
describe('Country desgnations', () => {
  it('should get list of areas', () => {
    return expect(Geocode.country('Zagreb', 'HR')).to.eventually.contain(pos)
  })
  it('should find lat lng', () => {
    var pos = { lat: 45.8150108, lng: 15.981919 }
    return expect(Geocode.latlng('Zagreb, HR')).to.eventually.become(pos)
  })
})
