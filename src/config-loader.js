'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');
const merge = require('lodash.merge');
const { toBase64 } = require('./helpers/util');

class ConfigLoader {
  /**
   * Constructor
   */
  constructor() {
    this._config = {};
    this._globalPath = process.cwd();
    this._globalConfig = {};
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
    const global = this._currentConfig['global'];

    if (global) {
      const fullPath = path.join(process.cwd(), global);
      this._globalPath = path.dirname(fullPath);
      this._globalConfig = ConfigLoader.readConfig(fullPath);
    } else {
      this._globalConfig = this._currentConfig;
    }
  }

  /**
   * Get application root directory
   * @returns {String}
   */
  appPath() {
    return this._globalPath;
  }

  /**
   * Get list of configuration files
   * @param {String} dir
   * @returns {Array}
   */
  listConfigs(dir = null) {
    const cwd = dir || this.appPath();

    return glob.sync('**/.terrahub.*', { cwd, ignore: ConfigLoader.IGNORE_PATTERNS });
  }

  /**
   * Get full centralized config
   * @returns {Object}
   */
  getFullConfig() {
    if (!Object.keys(this._config).length) {
      this._handleRootConfig();
      this._handleModuleConfigs();
    }

    return this._config;
  }

  /**
   * Separate global config from module's config
   * @private
   */
  _handleRootConfig() {
    Object.keys(this._globalConfig).forEach(key => {
      const cfg = this._globalConfig[key];

      if (cfg.hasOwnProperty('root')) {
        const hash = toBase64(cfg.root);

        this._config[hash] = cfg;
        delete this._globalConfig[key];
      }
    });

    Object.keys(this._config).forEach(module => {
      this._config[module] = merge({}, this._globalConfig, this._config[module]);
    });
  }

  /**
   * Consolidate all modules configs
   * @private
   */
  _handleModuleConfigs() {
    this
      .listConfigs(this.appPath())
      .filter(x => path.dirname(x) !== '.')
      .map(configPath => {
        const fullPath = path.join(this.appPath(), configPath);
        const config = ConfigLoader.readConfig(fullPath);
        const modulePath = this._modulePath(fullPath);

        delete config['global'];
        config['root'] = modulePath;

        this._config[toBase64(modulePath)] = merge({}, this._globalConfig, config);
    });
  }

  /**
   * @param {String} fullPath
   * @returns {*}
   * @private
   */
  _modulePath(fullPath) {
    const relativePath = fullPath.replace(this.appPath(), '.');

    return path.dirname(relativePath);
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
