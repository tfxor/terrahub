'use strict';

const fse = require('fs-extra');
const Twig = require('twig');
const request = require('request');
const mergeWith = require('lodash.mergewith');
const { createHash } = require('crypto');

/**
 * @param {String} text
 * @returns {*}
 */
function toMd5(text) {
  return createHash('md5').update(text).digest('hex');
}

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
 * Promisify request
 * @todo switch to requestify library which has less dependencies
 * @param {Object} options
 * @returns {Promise}
 * @private
 */
function promiseRequest(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        return reject(error);
      }

      return resolve(body);
    });
  });
}

/**
 * @param {String} srcFile
 * @param {Object} vars
 * @param {*} outFile
 * @returns {Promise}
 */
function renderTwig(srcFile, vars, outFile = false) {
  return new Promise((resolve, reject) => {
    if (!fs.exists(srcFile)) {
      return reject(new Error(`Twig template file by path ${srcFile} doesn't exist`));
    }

    Twig.renderFile(srcFile, vars, (err, data) => {
      if (err) {
        return reject(err);
      }

      if (!outFile) {
        return resolve(data);
      }

      fse.outputFile(outFile, data, { encoding: 'utf8' }, err => {
        return err ? reject(err) : resolve();
      });
    });
  });
}

/**
 * Connect child objects to their parents
 * @param {Object} data
 * @returns {Object}
 */
function familyTree(data) {
  const tree = {};
  const object = Object.assign({}, data);

  Object.keys(object).forEach(hash => {
    let node = object[hash];

    if (node.parent === null) {
      tree[hash] = node;
    } else {
      object[toMd5(node.parent)].children.push(node);
    }
  });

  return tree;
}

/**
 * @param {String} name
 * @returns {Boolean}
 */
function isAwsNameValid(name) {
  return /^([a-zA-Z0-9-_]*)$/.test(name);
}

/**
 * @param {*} objValue
 * @param {*} srcValue
 * @return {*}
 * @private
 */
function _customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

/**
 * Recursively merges object properties
 * @param {Object} object
 * @param {Object[]} sources
 * @param {Function} customizer
 * @returns {Object}
 */
function extend(object, sources, customizer = _customizer) {
  return mergeWith(object, ...sources, customizer);
}

/**
 * Public methods
 */
module.exports = {
  toMd5,
  extend,
  toBase64,
  fromBase64,
  familyTree,
  renderTwig,
  promiseSeries,
  promiseRequest,
  isAwsNameValid
};
