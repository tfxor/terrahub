'use strict';

const fse = require('fs-extra');
const Twig = require('twig');
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
 * Public methods
 */
module.exports = {
  toMd5,
  toBase64,
  fromBase64,
  renderTwig,
  promiseSeries,
  familyTree
};
