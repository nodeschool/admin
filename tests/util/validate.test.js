var Validate = require('../../lib/util/validate')
var chapterSchema = require('../../lib/util/schema/chapter')
var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('Util Validate', () => {
  var chapter = {
    location: {
      name: 'Osaka',
      country: 'JP',
      lat: 34.6937378,
      lng: 135.5021651
    },
    twitter: 'nodeschoolosa'
  }

  it('should validate chapter with error', () => {
    // Fails because name is not defined
    return Validate.validate(chapterSchema, '/testPath', chapter).catch(function (err) {
      return expect(err.type).to.equal('json')
    })
  })

  it('should run validate with chapter schema', () => {
    chapter.name = 'Osaka'
    return expect(Validate.validate(chapterSchema, '/testPath', chapter)).to.eventually.contain({name: 'Osaka'})
  })

  it('should validate chapter and be rejected', () => {
    chapter.name = undefined
    return expect(Validate.chapter('/testPath', chapter)).to.be.rejected
  })

  it('should validate chapter', () => {
    chapter.name = 'Osaka'
    return expect(Validate.chapter('/testPath', chapter)).to.eventually.contain({region: "Asia"})
  })
})
