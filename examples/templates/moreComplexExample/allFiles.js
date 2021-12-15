/* eslint-disable */

module.exports = ({ jsonInputs, libs: { _ } }) => {
  const allEnjoys = _.flatten(jsonInputs.map(({ enjoys }) => enjoys));
  const uniqueEnjoys = _.uniq(allEnjoys);

  console.log('Hello from allFiles.js', { uniqueEnjoys });
};
