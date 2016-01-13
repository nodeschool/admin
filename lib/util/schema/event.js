var Joi = require('joi')

module.exports = Joi.object().pattern(/\w+/, Joi.object().keys({
  location: Joi.object().keys({
    name: Joi.string().min(1).required(),
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required()
  }).required(),
  start: Joi.date().required(),
  end: Joi.date(),
  name: Joi.string().required(),
  contact: Joi.object().keys({
    skype: Joi.string(),
    appearIn: Joi.string().uri(),
    email: Joi.string().email()
  }).or('skype', 'appearIn', 'email'),
  url: Joi.string().uri({
    scheme: ['https', 'http']
  }).required()
})).required()
