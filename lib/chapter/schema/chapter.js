var Joi = require('joi')
var langList = require('iso3166-1').list().map(function (item) {
  return item.alpha2
})

module.exports = Joi.object().keys({
  name: Joi.string().required(),
  location: Joi.object().keys({
    name: Joi.string().required(),
    country: Joi.string().valid(langList).required(),
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }),
  twitter: Joi.string()
})