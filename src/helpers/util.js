'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const yaml = require('js-yaml');
const Twig = require('twig');
const ReadLine = require('readline');
const mergeWith = require('lodash.mergewith');
const { createHash } = require('crypto');

const rl = ReadLine.createInterface({
  input: process.stdin,
  output: process.stdout,
  historySize: 0
});

/**
 * @param {String} text
 * @returns {*}
 */
function toMd5(text) {
  return createHash('md5').update(text).digest('hex');
}

/**
 * Get timestamp based uuid
 * @return {*}
 */
function uuid() {
  return toMd5(Date.now().toString());
}

/**
 * @param {Function[]} promises
 * @returns {*}
 */
function promiseSeries(promises) {
  return promises.reduce((prev, fn) => prev.then(fn), Promise.resolve());
}

/**
 * Convert yaml to json
 * @param {String} srcFile
 * @returns {Object}
 */
function yamlToJson(srcFile) {
  return yaml.safeLoad(fs.readFileSync(srcFile));
}

/**
 * Convert json to yaml
 * @param {Object} json
 * @param {String|*} outFile
 * @returns {*}
 */
function jsonToYaml(json, outFile = false) {
  const data = yaml.safeDump(json, {});

  return outFile ? fse.outputFileSync(outFile, data) : data;
}

/**
 * @param {String} srcFile
 * @param {Object} vars
 * @param {*} outFile
 * @returns {Promise}
 */
function renderTwig(srcFile, vars, outFile = false) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(srcFile)) {
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

    if (node.depends_on.length) {
      tree[hash] = node;
    } else {
      const key = toMd5(node.depends_on[0]);
      if (!object.hasOwnProperty(key)) {
        throw new Error(`Couldn't find dependency '${node.depends_on[0]}'`);
      }

      object[key].children.push(node);
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
 * @returns {*}
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
 * @param {String} question
 * @return {Promise<Boolean>}
 */
function yesNoQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      if (!['y', 'yes'].includes(answer.toLowerCase())) {
        return resolve(false);
      }

      return resolve(true);
    });
  });
}

/**
 * @param {String} question
 * @return {Promise}
 */
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

/**
 * Public methods
 */
module.exports = {
  uuid,
  toMd5,
  extend,
  yamlToJson,
  jsonToYaml,
  familyTree,
  renderTwig,
  promiseSeries,
  yesNoQuestion,
  askQuestion,
  isAwsNameValid
};
