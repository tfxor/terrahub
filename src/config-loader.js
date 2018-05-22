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
    const [configFile] = this._find('.terrahub.+(json|yml|yaml)', globalPath);

    if (configFile) {
      this._globalConfig = ConfigLoader.readConfig(configFile);
    } else {
      fse.outputJsonSync(path.join(globalPath, '.terrahub.json'), {});
    }
  }

  /**
   * Read current directory config
   * @private
   */
  _readCurrent() {
    const [configFile] = this._find('.terrahub.+(json|yml|yaml)', process.cwd());

    if (configFile) {
      this._currentPath = path.dirname(configFile);
      this._currentConfig = ConfigLoader.readConfig(configFile);
    }
  }

  /**
   * Read root config
   * @private
   */
  _readRoot() {
    const global = this._currentConfig['global'];

    if (global) {
      const fullPath = path.join(this._currentPath, global);
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

    return this._find('**/.terrahub.+(json|yml|yaml)', cwd)
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
   * Check if valid configs were found
   * @returns {Boolean}
   */
  isConfigValid() {
    return Object.keys(Object.assign({}, this._rootConfig, this._currentConfig)).length > 0;
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
    const configs = this.listConfigs(appPath);

    // Remove root config
    configs.shift();

    configs.forEach(configPath => {
      const config = ConfigLoader.readConfig(configPath);
      const module = path.dirname(this._relativePath(configPath));

      delete config['global'];
      if (config.hasOwnProperty('parent')) {
        config['parent'] = this._relativePath(path.join(appPath, module, config.parent));
      }

      this._config[toBase64(module)] = merge({ root: module }, this._defaults(), this._rootConfig, config);
    });
  }

  /**
   * Find files by pattern
   * @param {String} pattern
   * @param {String} path
   * @returns {*}
   * @private
   */
  _find(pattern, path) {
    return glob.sync(pattern, { cwd: path, ignore: ConfigLoader.IGNORE_PATTERNS, absolute: true });
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
