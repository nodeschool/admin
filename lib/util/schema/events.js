var Joi = require('joi')
module.exports = Joi.object().pattern(/\w+/, require('./event')).required()
