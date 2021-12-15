/* eslint-disable */

module.exports = ({ firstName, lastName, enjoys, helpers, libs: { _ } }) => {
  const appName = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-homepage`;
  return `{
  "name": "${appName}",
  "version": "0.0.1",
  "description": "A page describing ${firstName} ${helpers.pluralize(lastName)} favorite things: ${helpers.concatArray(_.orderBy(enjoys, e => e, 'desc'), ', ')}",
  "author": "${firstName} ${lastName}",
  "main": "./dist/index.js",
  "license": "MIT",
  "bin": {
    "${appName}": "dist/index.js"
  },
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "axios": "^0.18.0",
    "babel": "^6.5.2",
    "babel-core": "^6.5.2",
    "body-parser": "^1.15.2",
    "express": "^4.13.4",
    "less": "^2.7.1",
    "lodash": "^4.13.1",
    "npm": "^3.7.2"
  }
}
`;
};
