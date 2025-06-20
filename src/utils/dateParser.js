// src/utils/dateParser.js
const { parse, isValid, format } = require('date-fns');

const FORMATS = [
  'dd-MM-yyyy',  // d-m-Y
  'yyyy-MM-dd',  // Y-m-d
  'MM/dd/yyyy'   // m/d/Y
];

/**
 * Try to parse `dateString` against multiple formats.
 * If valid, returns a 'yyyy-MM-dd' string; else null.
 */
function parseDate(dateString) {
  if (!dateString) return null;

  for (const fmt of FORMATS) {
    const dt = parse(dateString, fmt, new Date());
    if (isValid(dt)) {
      return format(dt, 'yyyy-MM-dd');
    }
  }
  return null;
}

module.exports = { parseDate };
