'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { config } = require('./parameters');
const { toMd5, extend, yamlToJson, jsonToYaml } = require('./helpers/util');

class ConfigLoader {
  /**
   * Constructor
   */
  constructor() {
    this._config = {};
    this._rootPath = false;
    this._rootConfig = {};
    this._projectConfig = {};
    this._projectCi = {};
    this._otherRootPaths = [];

    /**
     * Initialisation
     */
    this._readRoot();
  }

  /**
   * Component default config
   * @returns {Object}
   * @private
   */
  _defaults() {
    return {
      project: this.getProjectConfig(),
      dependsOn: [],
      children: [],
      hooks: {},
      build: {},
      ci: {}
    };
  }

  /**
   * Read root config
   * @private
   */
  _readRoot() {
    const configFile = this._findRootConfig(process.cwd());

    if (configFile) {
      this._rootPath = path.dirname(configFile);
      this._rootConfig = this._getConfig(configFile);
      this._projectConfig = Object.assign({ root: this._rootPath }, this._rootConfig['project']);
      this._projectCi = Object.assign({}, this._rootConfig['ci']);

      ['project', 'ci'].forEach(it => delete this._rootConfig[it]);
    } else {
      this._rootPath = false;
      this._rootConfig = {};
      this._projectConfig = {};
    }
  }

  /**
   * @param {String} dirPath
   * @return {String|Boolean}
   * @private
   */
  _findRootConfig(dirPath) {
    let config = {};
    let lower = path.resolve(dirPath, '..');
    let files = this._find('.terrahub.+(json|yml|yaml)', dirPath);

    if (files.length) {
      const configPath = files.pop();

      config = this._getConfig(configPath);
      if (config.hasOwnProperty('project')) {
        return configPath;
      }
    }

    if (lower !== dirPath) {
      return this._findRootConfig(lower);
    }

    return false;
  }

  /**
   * Get application root directory
   * @returns {String|Boolean}
   */
  appPath() {
    return this._rootPath;
  }

  /**
   * Get Project CI mapping
   * @return {Object}
   */
  getProjectCi() {
    return this._projectCi;
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
      this._handleComponentConfig();
      this._handleProjectCi();
    }

    return this._config;
  }

  /**
   * Get list of configuration files
   * @param {Object} options
   * @returns {Array}
   */
  listConfig(options = {}) {
    const { include } = this.getProjectConfig();
    const {
      dir = false,
      isEnv = false
    } = options;

    const searchPattern = isEnv ?
      `**/.terrahub.${config.env}.+(json|yml|yaml)` :
      '**/.terrahub.+(json|yml|yaml)';

    let searchPaths;
    if (dir) {
      searchPaths = [dir];
    } else if (include && include.length) {
      searchPaths = include.map(it => path.resolve(this.appPath(), it));
    } else {
      searchPaths = [this.appPath()];
    }

    return searchPaths
      .map(it => this._find(searchPattern, it))
      .reduce((accumulator, currentValue) => {
        accumulator.push(...currentValue);
        return accumulator;
      });
  }

  /**
   * Count of configured components
   * @returns {Number}
   */
  componentsCount() {
    return Object.keys(this.getFullConfig()).length;
  }

  /**
   * Get all root paths found in the project directory
   * @return {String[]}
   */
  getRootPaths() {
    return this._otherRootPaths.concat([this._rootPath]);
  }

  /**
   * Separate root config from component's config
   * @private
   */
  _handleRootConfig() {
    Object.keys(this._rootConfig).forEach(key => {
      const cfg = this._rootConfig[key];

      if (cfg.hasOwnProperty('root')) {
        const root = this.relativePath(path.join(this.appPath(), cfg.root));

        cfg.root = root;
        this._config[this.getComponentHash(root)] = cfg;
        delete this._rootConfig[key];
      }
    });

    Object.keys(this._config).forEach(module => {
      this._config[module] = extend({}, [this._defaults(), this._rootConfig, this._config[module]]);
    });
  }

  /**
   * Prepare CI data
   * @private
   */
  _handleProjectCi() {
    if ('mapping' in this._projectCi) {
      this._projectCi.mapping.forEach(
        (it, index) => this._projectCi.mapping[index] = path.resolve(this.appPath(), it)
      );
    }
  }

  /**
   * Consolidate all components' config
   * @private
   */
  _handleComponentConfig() {
    // Remove root config
    const componentConfigs = this.listConfig().slice(1);

    componentConfigs.forEach(configPath => {
      let config = this._getConfig(configPath);
      const componentPath = path.dirname(this.relativePath(configPath));
      const componentHash = this.getComponentHash(componentPath);

      if (config.hasOwnProperty('project')) {
        this._otherRootPaths.push(configPath);
      }

      // Delete in case of delete
      config = Object.assign(config, config.component);
      delete config.component;

      if (config.hasOwnProperty('dependsOn')) {
        if (!(config.dependsOn instanceof Array)) {
          throw new Error(`Error in component's configuration! DependsOn of '${config.name}' must be an array!`);
        }

        config.dependsOn.forEach((dep, index) => {
          config.dependsOn[index] = this.relativePath(path.resolve(this._rootPath, componentPath, dep));
        });
      }

      if (config.hasOwnProperty('ci') && config['ci'].hasOwnProperty('mapping')) {
        if (!(config.ci.mapping instanceof Array)) {
          throw new Error(`Error in component's configuration! CI Mapping of '${config.name}' must be an array!`);
        }

        config.ci.mapping.forEach((dep, index) => {
          config.ci.mapping[index] = path.resolve(this._rootPath, componentPath, dep);
        });
      }

      this._config[componentHash] = extend({ root: componentPath }, [this._defaults(), this._rootConfig, config]);
    });
  }

  /**
   * Build component hash
   * @param {String} fullPath
   * @returns {String}
   */
  getComponentHash(fullPath) {
    return toMd5(this.relativePath(fullPath));
  }

  /**
   * Find files by pattern
   * @param {String} pattern
   * @param {String} path
   * @returns {*}
   * @private
   */
  _find(pattern, path) {
    return glob.sync(pattern, { cwd: path, absolute: true, dot: true, ignore: this.IGNORE_PATTERNS });
  }

  /**
   * @param {String} fullPath
   * @returns {*}
   */
  relativePath(fullPath) {
    return fullPath.replace(this.appPath(), '.');
  }

  /**
   * @param {String} key
   * @param {String} value
   */
  addToGlobalConfig(key, value) {
    const cfgPath = path.join(this._rootPath, config.defaultFileName);
    const cfg = ConfigLoader.readConfig(cfgPath);

    cfg.project[key] = value;

    ConfigLoader.writeConfig(cfg, cfgPath);
  }

  /**
   * Updates root config
   */
  updateRootConfig() {
    this._readRoot();
  }

  /**
   * Get environment specific config
   * @param {String} cfgPath
   * @returns {*}
   * @private
   */
  _getConfig(cfgPath) {
    const cfg = ConfigLoader.readConfig(cfgPath);
    const envPath = path.join(path.dirname(cfgPath), config.fileName);
    const forceWorkspace = { terraform: { workspace: config.env } }; // Just remove to revert
    const overwrite = (objValue, srcValue) => {
      if (Array.isArray(objValue)) {
        return srcValue;
      }
    };

    return (!config.isDefault && fs.existsSync(envPath))
      ? extend(cfg, [ConfigLoader.readConfig(envPath), forceWorkspace], overwrite)
      : cfg;
  }

  /**
   * @param {String} cfgPath
   * @returns {Object}
   */
  static readConfig(cfgPath) {
    const type = path.extname(cfgPath);

    switch (type) {
      case '.yml':
      case '.yaml':
        return yamlToJson(cfgPath);
      case '.json':
        return require(cfgPath);
      default:
        throw new Error(`${type} config is not supported!`);
    }
  }

  /**
   * Write only allowed config
   * @param {Object} json
   * @param {String} outFile
   * @returns {Object}
   */
  static writeConfig(json, outFile) {
    const format = path.extname(outFile);

    switch (format) {
      case '.yml':
      case '.yaml':
        return jsonToYaml(json, outFile);
      case '.json':
        return fse.outputJsonSync(outFile, json, { spaces: 2 });
      default:
        throw new Error(`${format} config is not supported!`);
    }
  }

  /**
   * Glob patterns to exclude matches
   * @returns {String[]}
   * @constructor
   */
  get IGNORE_PATTERNS() {
    return this.getProjectConfig().ignore || ['**/node_modules/*', '**/.terraform/*'];
  }
}

module.exports = ConfigLoader;
