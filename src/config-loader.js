'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');
const merge = require('lodash.merge');
const { config, thbPath, templates } = require('./parameters');
const { toBase64 } = require('./helpers/util');

class ConfigLoader {
  /**
   * Constructor
   */
  constructor() {
    this._config = {};
    this._rootPath = false;
    this._rootConfig = {};
    this._globalConfig = {};
    this._projectConfig = {};

    /**
     * Init configs
     */
    this._readGlobal();
    this._readRoot();
  }

  /**
   * Component default config
   * @returns {Object}
   * @private
   */
  _defaults() {
    const hooks = templates.hooks;

    return {
      app: this.appPath(),
      parent: null,
      children: [],
      hooks: {
        plan: {
          before: `${hooks}/plan/before.js`,
          after: `${hooks}/plan/after.js`
        },
        apply: {
          before: `${hooks}/apply/before.js`,
          after: `${hooks}/apply/after.js`
        }
      }
    }
  }

  /**
   * Read/create global config
   * @private
   */
  _readGlobal() {
    const [configFile] = this._find('.terrahub.+(json|yml|yaml)', config.home);

    if (configFile) {
      this._globalConfig = ConfigLoader.readConfig(configFile);
    } else {
      fse.outputJsonSync(thbPath(config.fileName), {});
    }
  }

  /**
   * Read root config
   * @private
   */
  _readRoot() {
    const [configFile] = this._find('.terrahub.+(json|yml|yaml)', process.cwd());

    if (configFile) {
      this._rootPath = path.dirname(configFile);
      this._rootConfig = ConfigLoader.readConfig(configFile);
      this._projectConfig = Object.assign({ root: this._rootPath }, this._rootConfig['project']);

      delete this._rootConfig['project'];
    }
  }

  /**
   * Get application root directory
   * @returns {String|Boolean}
   */
  appPath() {
    return this._rootPath;
  }

  /**
   * Get global config
   * @returns {Object}
   */
  getGlobalConfig() {
    return this._globalConfig;
  }

  /**
   * Get project config
   * @returns {Object}
   */
  getProjectConfig() {
    return this._projectConfig;
  }

  /**
   * Get centralized application config
   * @returns {Object}
   */
  getFullConfig() {
    if (!Object.keys(this._config).length) {
      this._handleRootConfig();
      this._handleComponentConfigs();
    }

    return this._config;
  }

  /**
   * Get list of configuration files
   * @param {*} dir
   * @returns {Array}
   */
  listConfigs(dir = false) {
    const searchPath = dir || this.appPath();

    return searchPath
      ? this._find('**/.terrahub.+(json|yml|yaml)', searchPath)
      : [];
  }

  /**
   * Check if project is configured
   * @returns {Boolean}
   */
  isProjectConfigured() {
    return this._projectConfig.hasOwnProperty('name');
  }

  /**
   * Count of configured components
   * @returns {Number}
   */
  componentsCount() {
    return Object.keys(this.getFullConfig()).length;
  }

  /**
   * Separate root config from component's config
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
   * Consolidate all components' configs
   * @private
   */
  _handleComponentConfigs() {
    // Remove root config
    const configs = this.listConfigs().slice(1);

    configs.forEach(configPath => {
      const config = ConfigLoader.readConfig(configPath);
      const componentPath = path.dirname(this._relativePath(configPath));

      if (config.hasOwnProperty('parent')) {
        config['parent'] = path.join(componentPath, config.parent);
      }

      this._config[toBase64(componentPath)] = merge({root: componentPath}, this._defaults(), this._rootConfig, config);
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
