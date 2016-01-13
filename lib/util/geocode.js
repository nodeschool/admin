var log = require('npmlog')

function geoCode(lookup) {
  return new Promise(function (resolve, reject) {
    var nodeGeo = require('node-geo')
    nodeGeo.geocode(lookup, function (err, data) {
      if (err) {
        return reject({
          type: 'geojson',
          message: err
        })
      }
      log.silly('geocode', 'Response:\n' + data)
      resolve(data)
  }
}

exports.country = function (lookup, reference) {
  log.info('json', 'The ' + reference + ' is missing a country specification. Looking up ' + lookup + ' for a country.')
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
      resolve(country)
    })
  }
}

exports.latlon = function (lookup, reference) {

}
