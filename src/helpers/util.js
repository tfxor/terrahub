'use strict';

/**
 * @param {String} text
 * @returns {String}
 */
function toBase64(text) {
  return Buffer.from(text).toString('base64');
}

/**
 * @param {String} text
 * @returns {String}
 */
function fromBase64(text) {
  return Buffer.from(text, 'base64').toString('utf8');
}

/**
 * @param {Function[]} promises
 * @returns {*}
 */
function promiseSeries(promises) {
  return promises.reduce((prev, fn) => prev.then(fn), Promise.resolve());
}

/**
 * Public methods
 */
module.exports = {
  toBase64,
  fromBase64,
  promiseSeries
};
