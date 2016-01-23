var CountryDesignation = require('../../lib/country_designations.js')
var chai = require('chai')
var expect = chai.expect

describe('Country designations', () => {
  describe('areas', () => {
    it('should return an array with elements', () => {
      return expect(CountryDesignation.areas).to.be.instanceof(Array).and.to.not.be.empty
    })

    it('should return an array with the areas', () => {
      const Areas = [
        'Latin America',
        'South Pacific',
        'North America',
        'Asia',
        'Africa',
        'Europe',
        'Middle East',
        'Southpole'
      ]
      return expect(CountryDesignation.areas).to.eql(Areas)
    })
  })

  describe('prettyCountriesListByArea', () => {
    it('should return a function', () => {
      return expect(CountryDesignation.prettyCountriesListByArea).to.be.instanceof(Function)
    })
    it('should return an array with the "<Code> - <County>" syntax', () => {
      const prettyList = [
        'AQ - Antarctica',
        'BV - Bouvet Island',
        'TF - French Southern Territories',
        'HM - Heard Island and McDonald Islands',
        'GS - South Georgia and the South Sandwich Islands'
      ]
      return expect(CountryDesignation.prettyCountriesListByArea('Southpole')).to.be.instanceOf(Array).and.to.eql(prettyList)
    })
  })
})
