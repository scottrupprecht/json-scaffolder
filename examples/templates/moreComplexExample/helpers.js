/* eslint-disable */

module.exports = {
  dayOfTheWeek: () => new Date().toLocaleString('en-us', {  weekday: 'long' }),
  concatArray: (items, delimiter) => items.join(delimiter),
}
