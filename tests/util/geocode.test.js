var Geocode = require('../../lib/util/geocode')
var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('Utils Geocode', () => {
  it('should get country', () => {
    var pos = { long_name: 'Croatia', short_name: 'HR' }
    return expect(Geocode.country('Zagreb', 'HR')).to.eventually.contain(pos)
  })
  it('should find lat lng', () => {
    var pos = { lat: 45.8150108, lng: 15.981919 }
    return expect(Geocode.latlng('Zagreb, HR')).to.eventually.become(pos)
  })
})
