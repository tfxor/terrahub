'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');
const Twig = require('twig');
const logger = require('./logger');
const treeify = require('treeify');
const ReadLine = require('readline');
const mergeWith = require('lodash.mergewith');
const { spawn } = require('child-process-promise');
const childProcess = require('child_process');
const { createHash } = require('crypto');
const { EOL, platform, cpus, homedir } = require('os');

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
 * Get terrahub home path
 * @param {String} suffix
 * @returns {*}
 */
function homePath(...suffix) {
  return path.join(homedir(), '.terrahub', ...suffix);
}

/**
 * @param {Function[]} promises
 * @param {Function} callback
 * @returns {*}
 */
function promiseSeries(promises, callback = (prev, fn) => prev.then(fn)) {
  return promises.reduce(callback, Promise.resolve());
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

    if (!node.dependsOn.length) {
      tree[hash] = node;
    } else {
      const key = toMd5(node.dependsOn[0]);
      if (!object.hasOwnProperty(key)) {
        throw new Error(`Couldn't find dependency '${node.dependsOn[0]}'`);
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
 * @param {String} question
 * @return {Promise<Boolean>}
 */
function yesNoQuestion(question) {
  return askQuestion(question).then(answer => {
    if (!['y', 'yes'].includes(answer.toLowerCase())) {
      return Promise.resolve(false);
    }

    return Promise.resolve(true);
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
function spawner(command, args, options, onStderr, onStdout) {
  const stdout = [];
  const stderr = [];
  const promise = spawn(command, args, options);
  const child = promise.childProcess;

  child.stderr.on('data', data => {
    stderr.push(data);
    onStderr(data);
  });

  child.stdout.on('data', data => {
    stdout.push(data);
    onStdout(data);
  });

  return promise.then(() => Buffer.concat(stdout)).catch(err => {
    err.message = stderr;
    throw err;
  });
}

/**
 * @param {Function<Promise>} promiseFunction
 * @param {{ conditionFunction: Function<Boolean>?, maxRetries: Number?, intermediateAction: Function? }} options
 * @return {Promise}
 */
function exponentialBackoff(promiseFunction, options) {
  const {
    conditionFunction = () => true,
    maxRetries = 2,
    intermediateAction = () => {}
  } = options;
  let retries = 0;

  function retry() {
    return promiseFunction().catch(error => {
      if (!conditionFunction(error)) {
        return Promise.reject(error);
      }

      if (retries >= maxRetries) {
        error.message += `${EOL}Failed after ${maxRetries} retries.`;
        return Promise.reject(error);
      }

      return setTimeoutPromise(1000 * Math.exp(retries++)).then(() => {
        intermediateAction(retries, maxRetries);

        return retry();
      });
    });
  }

  return retry();
}

/**
 * @param {Number} timeout
 * @return {Promise}
 */
function setTimeoutPromise(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

/**
 * @param {Object|Array} config
 * @param {String} projectName
 */
function printListCommaSeparated(config, projectName) {
  const components = Object.keys(config).map(key => config[key].name).join(', ');

  logger.log(`Project: ${projectName} | Component${components.length > 1 ? 's' : ''}: ${components}`);
}

/**
 * @param {Object|Array} config
 * @param {Object} projectName
 */
function printListAsTree(config, projectName) {
  const componentList = arrayToObject(Object.keys(config).map(key => config[key].name));

  logger.log(`Project: ${projectName}`);

  treeify.asLines(componentList, false, line => {
    logger.log(` ${line}`);
  });
}

/**
 * @param {Object|Array} config
 * @param projectName
 */
function printListAuto(config, projectName) {
  const { length } = Object.keys(config);

  if (length > 5) {
    printListCommaSeparated(config, projectName);
  } else {
    printListAsTree(config, projectName);
  }
}

/**
 * @return {Number}
 */
function physicalCpuCount() {
  /**
   * @param {String} command
   * @return {String}
   */
  function exec(command) {
    return childProcess.execSync(command, { encoding: 'utf8' });
  }

  let amount;
  let platformCheck = platform();

  if (platformCheck === 'linux') {
    const output = exec('lscpu -p | egrep -v "^#" | sort -u -t, -k 2,4 | wc -l');
    amount = parseInt(output.trim(), 10);
  } else if (platformCheck === 'darwin') {
    const output = exec('sysctl -n hw.physicalcpu_max');
    amount = parseInt(output.trim(), 10);
  } else if (platformCheck === 'windows') {
    const output = exec('WMIC CPU Get NumberOfCores');
    amount = output.split(EOL)
      .map(line => parseInt(line))
      .filter(value => !isNaN(value))
      .reduce((sum, number) => (sum + number), 0);
  } else {
    const cores = cpus().filter(function (cpu, index) {
      const hasHyperthreading = cpu.model.includes('Intel');
      const isOdd = index % 2 === 1;
      return !hasHyperthreading || isOdd;
    });
    amount = cores.length;
  }
  return amount;
}

/**
 * @param {Error} error
 * @param {String} appPath
 * @return {*}
 */
function handleGitDiffError(error, appPath) {
  logger.debug(error);

  if (error.stderr) {
    const stderr = error.stderr.toString();

    if (/not found/.test(stderr)) {
      error.message = 'Git is not installed on this device.';
    } else if (/Not a git repository/i.test(stderr)) {
      error.message = `Git repository not found in '${appPath}'.`;
    }
  }

  return error;
}

/**
 * @param {Array} array
 * @throws Error;
 */
function arrayToObject(array) {
  if (!Array.isArray(array)) {
    throw new Error('Specified value is not an array!');
  }
  const result = {};

  array.forEach(val => { result[val] = null; });

  return result;
}

/**
 * Public methods
 */
module.exports = {
  uuid,
  toMd5,
  extend,
  spawner,
  homePath,
  yamlToJson,
  jsonToYaml,
  familyTree,
  renderTwig,
  askQuestion,
  promiseSeries,
  printListAuto,
  yesNoQuestion,
  isAwsNameValid,
  printListAsTree,
  physicalCpuCount,
  handleGitDiffError,
  exponentialBackoff,
  printListCommaSeparated
};
