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
const {
  EOL, platform, cpus, homedir
} = require('os');

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
        fse.outputFile(outFile, data, { encoding: 'utf8' }, err => (err ? reject(err) : resolve()));
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
    const object = { ...data};

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

    return promise.then(() => Buffer.concat(stdout)).catch(error => {
      const message = Buffer.concat(stderr).toString();

      throw new Error({...error, message });
    });
  }

  /**
   * @param {Function<Promise>} promiseFunction
   * @param {{
   *  conditionFunction: Function<Boolean>?,
   *  maxRetries: Number?,
   *  intermediateAction: Function?,
   *  component: String? }} options
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
        let { message } = error;
        message += `${EOL}💡${options.component ? `[${options.component}]` : ''} `+
          `Retried ${maxRetries} times, but still FAILED.`;

        throw new Error({...error, message });
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
   * @param {Object} config
   * @return {Number}
   */
  static threadsLimitCount(config) {
    const threadLimit = parseInt(config.threadLimit);

    return threadLimit ? threadLimit : cpus().length;
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
    return new Promise((resolve, reject) => glob(pattern, options,
      (error, files) => (error ? reject(error) : resolve(files))));
  }

  /**
   * Compose AWS credentials string
   * @param {Object} accountData
   * @param {Object} [sourceProfile]
   * @param {Boolean} tfvars
   * @return {String}
   */
  static prepareCredentialsFile({ accountData, sourceProfile, tfvars = false }) {
    let credentials = `[default]\n`;

    if (sourceProfile) {
      credentials += `aws_access_key_id = ${sourceProfile.env_var.AWS_ACCESS_KEY_ID.value}\n` +
        `aws_secret_access_key = ${sourceProfile.env_var.AWS_SECRET_ACCESS_KEY.value}\n` +
        `role_arn = ${accountData.env_var.AWS_ROLE_ARN.value}\n`;
    } else {
      credentials += `aws_access_key_id = ${accountData.env_var.AWS_ACCESS_KEY_ID.value}\n` +
        `aws_secret_access_key = ${accountData.env_var.AWS_SECRET_ACCESS_KEY.value}\n`;
    }

    if (tfvars) {
      const sourceProfileRegion = sourceProfile ? sourceProfile.env_var.AWS_DEFAULT_REGION : null;
      const region = accountData.env_var.AWS_DEFAULT_REGION
        || sourceProfileRegion || process.env.AWS_DEFAULT_REGION || 'us-east-1';

      credentials += `output = json\n` +
        `region = ${region.value || region}\n`;
    }

    credentials += `session_name = ${accountData.name}_${accountData.env_var.AWS_ACCOUNT_ID.value}`;

    return credentials;
  }

  /**
   * Creates AWS credentials file in temp directory
   * @param {String} credentials
   * @param {Object} config
   * @param {String} prefix
   * @param {Boolean} isCloud
   * @return {String}
   */
  static createCredentialsFile(credentials, config, prefix, isCloud = false) {
    const tmpPath = isCloud
      ? Util.homePathLambda(config.project.code, config.name)
      : Util.homePath('temp', config.project.code, config.name);

    fse.ensureDirSync(tmpPath);

    const credsPath = path.join(tmpPath, `aws_credentials_${prefix}`);

    fse.writeFileSync(credsPath, credentials);

    return credsPath;
  }

  /**
   * @return {String}
   */
  static get lambdaHomedir() {
    return '/tmp';
  }

  /**
   * Get terrahub home path in lambda
   * @param {String} suffix
   * @returns {*}
   */
  static homePathLambda(...suffix) {
    return path.join(Util.lambdaHomedir, '.terrahub', ...suffix);
  }
}

module.exports = Util;
