/* eslint-disable */

module.exports = ({ libs, helpers, ...providedParams }) =>
  JSON.stringify({...providedParams, libs: Object.keys(libs), helpers: Object.keys(helpers) }, null, 2);
