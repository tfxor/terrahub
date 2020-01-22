'use strict';

const fs = require('fs');
const url = require('url');
const path = require('path');
const fse = require('fs-extra');
const semver = require('semver');
const logger = require('../logger');
const download = require('download');
const Downloader = require('../downloader');
const Prepare = require('../prepare-helper');
const { spawner, homePath, homePathLambda } = require('../util');

class Sentinel {
  /**
   * @param {Object} config
   * @param {String} action
   * @param {String} componentPath
   */
  constructor(config, action, componentPath) {
    this._config = config;
    this._sentinelConfig = config.hook[action]['sentinel'];
    this._componentPath = componentPath;
    this._showLogs = !process.env.format;
  }

  /**
   * https://docs.hashicorp.com/sentinel/commands/test
   * @return {Promise}
   * @private
   */
  _test() {
    return Promise.resolve();
  }
  
  /**
   * https://docs.hashicorp.com/sentinel/commands/apply
   * @return {Promise}
   * @private
   */
  _apply() {
    const testPaths = this._sentinelConfig.hasOwnProperty('path') ? this._sentinelConfig.path : [];
    const sentinelArgs = ['-global'];
    const promises = [];

    if (testPaths.length > 0) {
      testPaths.forEach(element => {
        const cmd = [];
        cmd.push(`input=${'"`' + Prepare.getBinary(this._config) + ' show -json ' + this._getPlanPath() + '`"'}`);
        cmd.push(`-color=${false}`);
        const args = [`${this._getTestPath(element)}`];
        promises.push(this._spawn('apply', sentinelArgs.concat(cmd, args)));
        if (this._showLogs) {
          logger.warn(`[${this._config.name || this._config.root}] sentinel ${cmd} ${args.join(' ')}`);
        }
      });
    }

    return Promise.all(promises);
  }

  /**
   * @return {String}
   * @private
   */
  _getPlanPath() {
    return path.join(this._componentPath, 'terraform.tfplan');
  }

  /**
   * @param {String} testName
   * @return {String}
   * @private
   */
  _getTestPath(testName) {
    return path.join(this._componentPath, testName);
  }

  /**
   * Handle a spawn
   * @param {String} cmd
   * @param {Array} args
   * @return {Promise}
   * @private
   */
  async _spawn(cmd, args) {
    return spawner(this._getBinary(), [cmd, ...args], {cwd: this._componentPath, shell: true},
      err => logger.error(this._outMessage(err)),
      data => {
        if (this._showLogs) {
          logger.raw(this._outMessage(data));
        }
      }
    );
  }

  /**
   * @param {Buffer} data
   * @return {String}
   * @private
   */
  _outMessage(data) {
    let stdout = data.toString();
    const indexStart = stdout.indexOf('{');

    stdout = stdout[0] !== '{' ? stdout.substring(indexStart, stdout.length) : stdout;

    if (stdout.slice(-3) === `\n\n\n`) {
      stdout = stdout.slice(0, -1);
    }

    return `[${this._config.name || this._config.root}] ${stdout}`;
  }

  /**
   * @return {String}
   * @private
   */
  _getBinary() {
    return this._config.distributor === 'lambda'
      ? homePathLambda('sentinel', this._getVersion(), 'sentinel')
      : homePath('sentinel', this._getVersion(), 'sentinel');
  }

  /**
   * @return {String}
   * @private
   */
  _getBinaryPath() {
    return this._config.distributor === 'lambda'
      ? homePathLambda('sentinel', this._getVersion())
      : homePath('sentinel', this._getVersion());
  }

  /**
   * @return {String}
   * @private
   */
  _getVersion() {
    let version = this._sentinelConfig.hasOwnProperty('version') ? this._sentinelConfig.version : '0.14.2';
    if (!semver.valid(version)) {
      throw new Error(`Sentinel version ${version} is invalid`);
    }

    return version;
  }

  /**
   * Ensure binary exists (download otherwise)
   * @return {Promise}
   */
  checkSentinelBinary() {
    try {
      const stat = fs.statSync(this._getBinary());

      if (stat !== null && stat.isFile()) {
        return Promise.resolve();
      }
    } catch (error) {
      switch (error.code) {
        case 'ENOENT':
          return this._download();
        case 'ETXTBSY':
          return Promise.resolve();
        default:
          throw error;
      }
    }
  }

  /**
   * Download & unzip file
   * @return {Promise}
   * @private
   */
  _download() {
    const arch = Downloader.getOsArch();
    const fullUrl = url.resolve(
      'https://releases.hashicorp.com/sentinel/', `${this._getVersion()}/sentinel_${this._getVersion()}_${arch}.zip`
    );
    return fse
      .ensureDir(this._getBinaryPath())
      .then(() => download(fullUrl, this._getBinaryPath(), { extract: true }));
  }

  /**
   * @return {Promise}
   */
  runByCommand() {
    const action = this._sentinelConfig.hasOwnProperty('command') ? this._sentinelConfig.command : 'apply';

    switch (action) {
      case 'apply':
        return this._apply();
      case 'test':
        return this._test();
      default:
        return Promise.resolve();
    }
  }

  /**
   * Run sentinel
   * @param {Object} config
   * @param {String} action
   * @param {String} when
   * @param {String} componentPath
   * @return {Promise}
   */
  static run(config, action, when, componentPath){
    const sentinel = new Sentinel(config, action, componentPath);
    sentinel.checkSentinelBinary();
    switch (action) {
      case 'plan':
        return (when === 'after') ? sentinel.runByCommand() : Promise.resolve();
      case 'apply':
      case 'destroy':
        return (when === 'before') ? sentinel.runByCommand() : Promise.resolve();
      default:
        return Promise.resolve();
    }
  }
}

module.exports = Sentinel;
