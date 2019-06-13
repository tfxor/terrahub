'use strict';

const fs = require('fs');
const path = require('path');
const Twig = require('twig');
const glob = require('glob');
const fse = require('fs-extra');
const yaml = require('js-yaml');
const ReadLine = require('readline');
const { createHash } = require('crypto');
const mergeWith = require('lodash.mergewith');
const childProcess = require('child_process');
const { spawn } = require('child-process-promise');
const { EOL, platform, cpus, homedir } = require('os');

/**
 * @static
 */
class Util {
  /**
   * @param {String} text
   * @returns {String}
   */
  static toMd5(text) {
    return createHash('md5').update(text).digest('hex');
  }

  /**
   * Get timestamp based uuid
   * @return {String}
   */
  static uuid() {
    return Util.toMd5(Date.now().toString());
  }

  /**
   * Get terrahub home path
   * @param {String} suffix
   * @returns {*}
   */
  static homePath(...suffix) {
    return path.join(homedir(), '.terrahub', ...suffix);
  }

  /**
   * @param {Function[]} promises
   * @param {Function} callback
   * @returns {Promise}
   */
  static promiseSeries(promises, callback = (prev, fn) => prev.then(fn)) {
    return promises.reduce(callback, Promise.resolve());
  }

  /**
   * Convert yaml to json
   * @param {String} srcFile
   * @returns {Object}
   */
  static yamlToJson(srcFile) {
    return yaml.safeLoad(fs.readFileSync(srcFile));
  }

  /**
   * Convert json to yaml
   * @param {Object} json
   * @param {String|*} outFile
   * @returns {*}
   */
  static jsonToYaml(json, outFile = false) {
    const data = yaml.safeDump(json, {});

    return outFile ? fse.outputFileSync(outFile, data) : data;
  }

  /**
   * @param {String} srcFile
   * @param {Object} vars
   * @param {String} outFile
   * @returns {Promise}
   */
  static renderTwig(srcFile, vars, outFile = null) {
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
        fse.outputFile(outFile, data, { encoding: 'utf8' }, err => err ? reject(err) : resolve());
      });
    });
  }

  /**
   * Connect child objects to their parents
   * @param {Object} data
   * @returns {Object}
   */
  static familyTree(data) {
    const tree = {};
    const object = Object.assign({}, data);

    Object.keys(object).forEach(hash => {
      let node = object[hash];

      if (!node.dependsOn.length) {
        tree[hash] = node;
      } else {
        const key = Util.toMd5(node.dependsOn[0]);
        if (!object.hasOwnProperty(key)) {
          throw new Error(`Couldn't find dependency '${node.dependsOn[0]}'`);
        }

        object[key].children.push(node);
      }
    });

    return tree;
  }

  /**
   * @param {String[]} names
   * @param {Object} config
   * @returns {Object}
   */
  static getNonUniqueNames(names, config) {
    const result = {};

    Object.keys(config)
      .filter(hash => names.includes(config[hash].name))
      .forEach(hash => { result[hash] = config[hash].root; });

    return result;
  }

  /**
   * @param {String} name
   * @returns {Boolean}
   */
  static isAwsNameValid(name) {
    return /^([a-zA-Z0-9-_]*)$/.test(name);
  }

  /**
   * @param {*} objValue
   * @param {*} srcValue
   * @returns {*}
   * @private
   */
  static _customizer(objValue, srcValue) {
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
  static extend(object, sources, customizer = Util._customizer) {
    return mergeWith(object, ...sources, customizer);
  }

  /**
   * @return {Interface}
   */
  static get readLineInterface() {
    if (!Util._readLineInterface) {
      Util._readLineInterface = ReadLine.createInterface({
        input: process.stdin,
        output: process.stdout,
        historySize: 0
      });
    }

    return Util._readLineInterface;
  }

  /**
   * @param {String} question
   * @return {Promise}
   */
  static askQuestion(question) {
    return new Promise(resolve => {
      Util.readLineInterface.question(question, resolve);
    });
  }

  /**
   * @param {String} question
   * @return {Promise<Boolean>}
   */
  static yesNoQuestion(question) {
    return Util.askQuestion(question).then(answer => {
      return Promise.resolve(['y', 'yes'].includes(answer.toLowerCase()));
    });
  }

  /**
   * Just better spawn with middleware
   * @param {String} command
   * @param {Array} args
   * @param {Object} options
   * @param {Function} onStderr
   * @param {Function} onStdout
   * @returns {Promise}
   */
  static spawner(command, args, options, onStderr, onStdout) {
    const stdout = [];
    const stderr = [];
    const promise = spawn(command, args, options);
    const { childProcess } = promise;

    childProcess.stderr.on('data', data => {
      if (data.toString() !== '\n') {
        stderr.push(data);
        onStderr(data);
      }
    });

    childProcess.stdout.on('data', data => {
      stdout.push(data);
      onStdout(data);
    });

    return promise.then(() => Buffer.concat(stdout)).catch(err => {
      err.message = Buffer.concat(stderr).toString();

      return Promise.reject('Error occurred. Please try again. If this problem persists, ' +
        'enable extra debugging (DEBUG=debug) to see more details and open an issue at ' +
        'https://github.com/TerraHubCorp/terrahub/issues');
    });
  }

  /**
   * @param {Function<Promise>} promiseFunction
   * @param {{ conditionFunction: Function<Boolean>?, maxRetries: Number?, intermediateAction: Function? }} options
   * @return {Promise}
   */
  static exponentialBackoff(promiseFunction, options = {}) {
    const {
      maxRetries = 2,
      conditionFunction = () => true,
      intermediateAction = () => {}
    } = options;
    let retries = 0;

    /**
     * @return {Promise}
     */
    const retry = () => promiseFunction().catch(error => {
      if (!conditionFunction(error)) {
        return Promise.reject(error);
      }

      if (retries >= maxRetries) {
        error.message += `${EOL}Failed after ${maxRetries} retries.`;
        return Promise.reject(error);
      }

      return Util.setTimeoutPromise(1000 * Math.exp(retries++)).then(() => {
        intermediateAction(retries, maxRetries);

        return retry();
      });
    });

    return retry();
  }

  /**
   * @param {Number} timeout
   * @return {Promise}
   */
  static setTimeoutPromise(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }

  /**
   * @return {Number}
   */
  static physicalCpuCount() {
    /**
     * @param {String} command
     * @return {String}
     */
    const exec = command => childProcess.execSync(command, { encoding: 'utf8' });

    let amount;
    let platformCheck = platform();

    switch (platformCheck) {
      case 'win32': {
        const output = exec('WMIC CPU Get NumberOfCores');

        amount = output.split(EOL)
          .map(line => parseInt(line))
          .filter(value => !isNaN(value))
          .reduce((sum, number) => (sum + number), 0);
        break;
      }

      case 'linux': {
        const output = exec('lscpu -p | egrep -v "^#" | sort -u -t, -k 2,4 | wc -l');
        amount = parseInt(output.trim(), 10);
        break;
      }

      case 'darwin': {
        const output = exec('sysctl -n hw.physicalcpu_max');
        amount = parseInt(output.trim(), 10);
        break;
      }

      default: {
        const cores = cpus().filter((cpu, index) => {
          const hasHyperThreading = cpu.model.includes('Intel');
          const isOdd = index % 2 === 1;

          return !hasHyperThreading || isOdd;
        });

        amount = cores.length;
        break;
      }
    }

    return amount;
  }

  /**
   * @param {Array} array
   * @return {Object}
   * @throws Error;
   */
  static arrayToObject(array) {
    if (!Array.isArray(array)) {
      throw new Error('Specified value is not an array!');
    }
    const result = {};

    array.forEach(val => { result[val] = null; });

    return result;
  }

  /**
   * @param {String} pattern
   * @param {Object} options
   * @return {Promise}
   */
  static globPromise(pattern, options) {
    return new Promise((resolve, reject) =>
      glob(pattern, options, (error, files) => error ? reject(error) : resolve(files))
    );
  }
}

module.exports = Util;
