/* global it describe */
var chai = require('chai')
var expect = chai.expect
var eventTime = require('../../lib/util/eventTime.js')

describe('Event Time Tests', () => {
  it('should test if the time is valid', () => {
    const time = '07:15:30'
    return expect(eventTime.timeRegex.test(time)).to.equal(true)
  })
})
