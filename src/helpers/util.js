'use strict';

const fse = require('fs-extra');
const Twig = require('twig');

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
 * @param {String} srcFile
 * @param {Object} vars
 * @param {*} outFile
 * @returns {Promise}
 */
function renderTwig(srcFile, vars, outFile = false) {
  return new Promise((resolve, reject) => {
    Twig.renderFile(srcFile, vars, (err, data) => {
      if (err) {
        return reject(err);
      }

      if (!outFile) {
        return resolve(data);
      }

      return fse.outputFile(outFile, data, 'utf-8');
    });
  });
}

/**
 * Public methods
 */
module.exports = {
  toBase64,
  fromBase64,
  renderTwig,
  promiseSeries
};
