var Joi = require('joi')
var eventTime = require('../eventTime')

var date = Joi.string().regex(eventTime.dateRegex)
var time = Joi.string().regex(eventTime.timeRegex).required()
module.exports = Joi.object().keys({
  location: Joi.object().keys({
    name: Joi.string().min(1).required(),
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).required(),
  startDate: date.required(),
  startTime: time,
  endDate: date,
  endTime: time,
  contact: Joi.object().keys({
    skype: Joi.string(),
    appearIn: Joi.string().uri(),
    email: Joi.string().email()
  }).or('skype', 'appearIn', 'email'),
  url: Joi.string().uri({
    scheme: ['https', 'http']
  }).required()
})
