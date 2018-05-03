'use strict';

const fs = require('fs');
const glob = require('glob');
const path = require('path');
const yaml = require('js-yaml');
const merge = require('lodash.merge');

class ConfigLoader {
  /**
   * Constructor
   */
  constructor() {
    this._config = {};
    this._globalPath = process.cwd();
    this._currentPath = process.cwd();
    this._currentConfig = {};

    /**
     * Init config reader
     */
    this._readCurrent();
    this._readGlobal();
  }

  /**
   * Read current directory config
   * @returns {Object}
   * @private
   */
  _readCurrent() {
    const [configFile] = glob.sync('.terrahub.*', { cwd: process.cwd(), ignore: ConfigLoader.IGNORE_PATTERNS });

    if (configFile) {
      this._currentPath = path.join(process.cwd(), configFile);
      this._currentConfig = ConfigLoader.readConfig(this._currentPath);
    }
  }

  /**
   * Read global config
   * @returns {Object}
   * @private
   */
  _readGlobal() {
    const globalPath = this._currentConfig['global'];

    if (globalPath) {
      this._config = ConfigLoader.readConfig(globalPath);
      this._globalPath = path.join(process.cwd(), globalPath);
    }
  }

  /**
   * Get application root directory
   * @returns {String}
   */
  getAppPath() {
    return fs.lstatSync(this._globalPath).isFile()
      ? path.dirname(this._globalPath)
      : this._globalPath;
  }

  /**
   * Get list of configuration files
   * @param {String} dir
   * @returns {*}
   */
  listConfigs(dir = null) {
    const cwd = dir || this.getAppPath();

    return glob.sync('**/.terrahub.*', { cwd, ignore: ConfigLoader.IGNORE_PATTERNS });
  }

  /**
   * Get full centralized config
   * @returns {Object}
   */
  getFullConfig() {
    const configs = this.listConfigs(this.getAppPath()).map(config => path.join(this.getAppPath(), config));

    configs.map(fullPath => {
      const config = ConfigLoader.readConfig(fullPath);
      delete config['global'];

      this._config = merge(this._config, config);
    });

    return this._config;
  }

  /**
   * @param {String} cfgPath
   * @returns {Object}
   * @private
   */
  static readConfig(cfgPath) {
    const type = path.extname(cfgPath);

    switch (type) {
      case '.yml':
      case '.yaml':
        return yaml.safeLoad(fs.readFileSync(cfgPath));
      case '.json':
        return require(cfgPath);
      default:
        throw new Error(`${type} config is not supported!`);
    }
  }

  /**
   * Glob patterns to exclude matches
   * @returns {String[]}
   * @constructor
   */
  static get IGNORE_PATTERNS() {
    return ['**/node_modules/*'];
  }
}

module.exports = ConfigLoader;
