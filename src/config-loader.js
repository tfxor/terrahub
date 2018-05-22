'use strict';

const os = require('os');
const fs = require('fs');
const fse = require('fs-extra');
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
    this._globalConfig = {};
    this._rootPath = process.cwd();
    this._rootConfig = {};
    this._currentPath = process.cwd();
    this._currentConfig = {};

    /**
     * Init config reader
     */
    this._readGlobal();
    this._readCurrent();
    this._readRoot();
  }

  /**
   * Read/create global config
   * @private
   */
  _readGlobal() {
    // @todo move to a global config?
    const globalPath = path.join(os.homedir(), '.terrahub');
    const [fileName] = glob.sync('.terrahub.*', { cwd: globalPath });

    if (fileName) {
      this._globalConfig = ConfigLoader.readConfig(path.join(globalPath, fileName));
    } else {
      fse.outputJsonSync(path.join(globalPath, '.terrahub.json'), {});
    }
  }

  /**
   * Read current directory config
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
   * Read root config
   * @private
   */
  _readRoot() {
    const global = this._currentConfig['global'];

    if (global) {
      const fullPath = path.join(process.cwd(), global);
      this._rootPath = path.dirname(fullPath);
      this._rootConfig = ConfigLoader.readConfig(fullPath);
    } else {
      this._rootConfig = this._currentConfig;
    }
  }

  /**
   * Get application root directory
   * @returns {String}
   */
  appPath() {
    return this._rootPath;
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
   * Get global config
   * @returns {Object}
   */
  getGlobalConfig() {
    return this._globalConfig;
  }

  /**
   * Get centralized application config
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
   * @returns {Object}
   * @private
   */
  _defaults() {
    return {
      app: this.appPath(),
      parent: null,
      children: [],
      hooks: {
        plan: {},
        apply: {},
        destroy: {}
      },
    }
  }

  /**
   * Separate global config from module's config
   * @private
   */
  _handleRootConfig() {
    Object.keys(this._rootConfig).forEach(key => {
      const cfg = this._rootConfig[key];

      if (cfg.hasOwnProperty('root')) {
        this._config[toBase64(cfg.root)] = cfg;
        delete this._rootConfig[key];
      }
    });

    Object.keys(this._config).forEach(module => {
      this._config[module] = merge({}, this._defaults(), this._rootConfig, this._config[module]);
    });
  }

  /**
   * Consolidate all modules configs
   * @private
   */
  _handleModuleConfigs() {
    const appPath = this.appPath();

    this
      .listConfigs(appPath)
      .filter(x => path.dirname(x) !== '.')
      .map(configPath => {
        const fullPath = path.join(appPath, configPath);
        const config = ConfigLoader.readConfig(fullPath);
        const module = path.dirname(this._relativePath(fullPath));

        delete config['global'];
        if (config.hasOwnProperty('parent')) {
          config['parent'] = this._relativePath(path.join(appPath, module, config.parent));
        }

        this._config[toBase64(module)] = merge({ root: module }, this._defaults(), this._rootConfig, config);
    });
  }

  /**
   * @param {String} fullPath
   * @returns {*}
   * @private
   */
  _relativePath(fullPath) {
    return fullPath.replace(this.appPath(), '.');
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
