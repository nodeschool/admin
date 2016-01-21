var dateRegex = new RegExp('^' + // ^ make sure there is no prefix
  '(' +                // [1] Variant A: 1999/12/31
    '(' +
      '[0-9]{4}' +      // [2] Year: 1999
    ')\/(' +            // [3] Month: (0)1-12
      '(' +
        '0?[1-9]' +     // [4] (0)1-9
      ')|(' +
        '1[0-2]' +      // [5] 10-12
      ')' +
    ')\/(' +            // [6] Date: (0)1-31
      '(' +
        '0?[1-9]' +    // [7] (0)1-9
      ')|(' +
        '[1-2][0-9]' +  // [8] 10-29
      ')|(' +
        '3[0-1]' +      // [9] 30-31
      ')' +
    ')' +
  ')|(' +               // [10] Variant B: 31.12.1999
    '(' +               // [11] Date: (0)1-31
      '(' +
        '0?[1-9]' +     // [12] (0)1-9
      ')|(' +
        '[1-2][0-9]' +  // [13] 10-29
      ')|(' +
        '3[0-1]' +      // [14] 30-31
      ')' +
    ')\.(' +            // [15] Month: (0)1-12
      '(' +
        '0?[1-9]' +     // [16] (0)1-9
      ')|(' +
        '1[0-2]' +      // [17] 10-12
      ')' +
    ')\.(' +
      '[0-9]{4}' +      // [18] Year: 1999
    ')' +
  ')$')               // $ = make sure there is no postfix

var timeRegex = new RegExp('^' + // ^ make sure there is no prefix
    '(' +                // [1] Variant A: 29:59
      '(' +
        '[0-2]?[0-9]' +  // [2] Hour: 00-29 (29:59 is just before 6am next day, useful for late-night events)]
      ')\:(' +
        '[0-5][0-9]' +   // [3] Minute: 00-59
      ')' +
    ')|(' +              // [4] Variant B: 12:59am
      '(' +              // [5] Hour: 12
        '(' +
          '0?[0-9]' +    // [6] 0-9 or 00-09
        ')|(' +
          '1[0-2]' +     // [7] 10-12
        ')' +
      ')(' +             // [8] Minute + prefix ':59'
        '\:' +
        '([0-5][0-9])' + // [9] Minute: 00-59)
      ')?' +             // optional: [11] [12]
      '(' +
        '(' +            // [10] am/pm
          '(a|p)m' +     // [11] a/p
        ')|(' +          // [12] AM/PM
          '(A|P)M' +     // [13] A/P
        ')' +
      ')' +
    ')' +
  '$')                 // $ = make sure there is no postfix

function fill (str) {
  return str ? (str.length === 0 ? '0' + str : str) : '00'
}

function parseDateTime (input, time, timeZone) {
  var dateParts = dateRegex.exec(input)
  if (!dateParts) {
    throw new Error('Date can not be parsed. ' + input)
  }
  var timeParts = timeRegex.exec(time)
  if (!timeParts) {
    throw new Error('Time can not be parsed. ' + time)
  }
  var year = dateParts[2] || dateParts[18]
  var month = dateParts[3] || dateParts[15]
  var date = dateParts[6] || dateParts[11]
  var amPm = timeParts[10] || timeParts[12]
  var hour
  if (amPm) {
    hour = timeParts[5]
    if (amPm === 'pm' || amPm === 'AM') {
      hour = parseInt(hour, 10) + 12
    }
  } else {
    hour = timeParts[2]
  }
  var minute = timeParts[3] || timeParts[9]
  var moment = require('moment-timezone')
  var parseStr = year + '-' + fill(month) + '-' + fill(date) + ' ' + fill(hour) + ':' + fill(minute)
  return moment.tz(parseStr, timeZone)
}

parseDateTime.dateRegex = dateRegex
parseDateTime.timeRegex = timeRegex
parseDateTime.forEvent = function (event) {
  var start = parseDateTime(event.startDate, event.startTime, event.location.timeZone)
  var end = parseDateTime(event.endDate || event.startDate, event.endTime, event.location.timeZone)
  return {
    start: start,
    end: end,
    durationInMs: end.diff(start)
  }
}
module.exports = parseDateTime
