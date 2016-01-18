var log = require('npmlog')
var util = require('util')

function geoCode (lookup) {
  return new Promise(function (resolve, reject) {
    var nodeGeo = require('node-geo')
    var next = function (err, data) {
      if (err) {
        return reject({
          type: 'geojson',
          message: err
        })
      }
      log.silly('geocode', 'Response:\n' + util.inspect(data, {depth: null, colors: true}))
      resolve(data)
    }
    if (typeof lookup === 'string') {
      nodeGeo.geocode(lookup, next)
    } else {
      nodeGeo.reverseGeocode(lookup.lat, lookup.lng, next)
    }
  })
}

exports.country = function (lookup, reference) {
  log.info('json', 'The ' + reference + ' is missing a country specification. Looking up ' + JSON.stringify(lookup) + ' for a country.')
  return geoCode(lookup)
    .then(function (data) {
      var country = null
      if (data && data.results) {
        var list = data.results
        for (var i = 0; country === null && i < list.length; i++) {
          var comps = list[i].address_components
          for (var j = 0; country === null && j < comps.length; j++) {
            var comp = comps[j]
            if (comp.types.indexOf('country') !== -1 && comp.types.indexOf('political') !== -1) {
              country = comp
            }
          }
        }
      }
      return country
    })
}

exports.latlng = function (lookup, reference) {
  log.info('json', 'The location of ' + reference + ' doesnt have lat/lng data so the data is being fetched for location: ' + lookup)
  return geoCode(lookup)
    .then(function (data) {
      return ((data && data.results && data.results[0] && data.results[0].geometry && data.results[0].geometry.location) || {})
    })
}
