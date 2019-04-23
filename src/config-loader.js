'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const fse = require('fs-extra');
const { config } = require('./parameters');
const Dictionary = require('./helpers/dictionary');
const ListException = require('./exceptions/list-exception');
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
    this._format = '.' + config.format;

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
      cfgEnv: config.env,
      project: this.getProjectConfig(),
      hook: {},
      build: {},
      include: [],
      exclude: [],
      mapping: [],
      children: [],
      terraform: {},
      dependsOn: [],
      env: { variables: {} }
    };
  }

  /**
   * Read root config
   * @private
   */
  _readRoot() {
    const configFile = this._findRootConfig(process.cwd());

    if (configFile) {
      this._format = path.extname(configFile);
      this._fileName = config.isDefault ? `.terrahub${this._format}` : `.terrahub.${config.env}${this._format}`;
      this._defaultFileName = `.terrahub${this._format}`;
      this._rootPath = path.dirname(configFile);
      this._rootConfig = this._getConfig(configFile);
      this._projectConfig = Object.assign({ root: this._rootPath }, this._rootConfig['project']);

      this._handleProjectConfig();

      delete this._rootConfig['project'];
    } else {
      this._rootPath = false;
      this._rootConfig = {};
      this._projectConfig = {};
    }
  }

  /**
   * @return {String}
   */
  getFileName() {
    return this._fileName;
  }

  /**
   * @return {String}
   */
  getDefaultFileName() {
    return this._defaultFileName;
  }

  /**
   * @param {String} dirPath
   * @return {String}
   * @private
   */
  _findRootConfig(dirPath) {
    let projectConfigPath = null;

    let currentDir = null;
    let lowerDir = dirPath;

    while (!projectConfigPath && currentDir !== lowerDir) {
      currentDir = lowerDir;
      lowerDir = path.join(currentDir, '..');

      const files = this._find('.terrahub.+(json|yml|yaml)', currentDir);

      if (files.length) {
        const [configPath] = files; // if multiple configs found take the first
        const config = ConfigLoader.readConfig(configPath);

        if (config.hasOwnProperty('project')) { // check if it is as project config
          projectConfigPath = configPath;
        }
      }
    }

    return projectConfigPath;
  }

  /**
   * Get application root directory
   * @returns {String}
   */
  appPath() {
    return this._rootPath;
  }

  /**
   * Get Project Format
   * @return {String}
   */
  getProjectFormat() {
    return this._format;
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
    }

    return this._config;
  }

  /**
   * Get list of configuration files
   * @param {String} dir
   * @param {Number} env
   * @returns {String[]}
   */
  listConfig({ dir = null, env = Dictionary.ENVIRONMENT.DEFAULT } = {}) {
    const { include } = this.getProjectConfig();

    let searchPattern;
    switch (env) {
      case Dictionary.ENVIRONMENT.DEFAULT:
        searchPattern = '**/.terrahub.+(json|yml|yaml)';
        break;

      case Dictionary.ENVIRONMENT.SPECIFIC:
        searchPattern = `**/.terrahub.${config.env}.+(json|yml|yaml)`;
        break;

      case Dictionary.ENVIRONMENT.EVERY:
        searchPattern = '**/.terrahub*.+(json|yml|yaml)';
        break;
    }

    let searchPaths;
    if (dir) {
      searchPaths = [dir];
    } else if (include.length) {
      searchPaths = include.map(it => path.resolve(this.appPath(), it));
    } else {
      searchPaths = [this.appPath()];
    }

    return [].concat(...searchPaths.map(it => this._find(searchPattern, it)));
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
   * Consolidate all components' config
   * @private
   */
  _handleComponentConfig() {
    const configPaths = this.listConfig();
    const rootPaths = {};

    configPaths.forEach(configPath => {
      let config = this._getConfig(configPath);

      if (config.hasOwnProperty('project')) {
        rootPaths[path.dirname(configPath)] = null;
        return;
      }

      const componentPath = path.dirname(this.relativePath(configPath));
      const componentHash = this.getComponentHash(componentPath);

      // Delete in case of delete
      config = Object.assign(config, config.component);

      if (config.hasOwnProperty('dependsOn')) {
        if (!(config.dependsOn instanceof Array)) {
          throw new Error(`Error in component's configuration! DependsOn of '${config.name}' must be an array!`);
        }

        config.dependsOn.forEach((dep, index) => {
          config.dependsOn[index] = this.relativePath(path.resolve(this._rootPath, componentPath, dep));
        });
      }

      if (config.hasOwnProperty('mapping')) {
        if (!Array.isArray(config.mapping)) {
          throw new Error(`Error in component's configuration! CI Mapping of '${config.name}' must be an array!`);
        }

        config.mapping.push('.');
        config.mapping = [...new Set(config.mapping.map(it => path.join(componentPath, it)))];
      }

      if (config.hasOwnProperty('env')) {
        ['hook', 'build'].forEach(key => {
          if (config[key]) {
            if (!config[key].env) {
              config[key].env = {};
            }
            config[key].env.variables = Object.assign({}, config.env.variables, config[key].env.variables);
          }
        });
      }

      ['env', 'component'].forEach(key => delete config[key]);

      this._config[componentHash] = extend({ root: componentPath }, [this._defaults(), this._rootConfig, config]);
    });

    rootPaths[this._rootPath] = null;
    const pathsArray = Object.keys(rootPaths);

    if (pathsArray.length > 1) {
      throw new ListException(pathsArray, {
        header: 'Multiple root configs identified in this project:',
        footer: 'ONLY 1 root config per project is allowed. Please remove all the other and try again.',
        style: ListException.NUMBER
      });
    }
  }

  /**
   * Process the project config data
   * @private
   */
  _handleProjectConfig() {
    if (this._projectConfig.hasOwnProperty('mapping')) {
      const { mapping } = this._projectConfig;

      if (!(mapping instanceof Array)) {
        throw new Error(`Error in project's configuration! CI Mapping of the project must be an array!`);
      }

      mapping.forEach((dep, index) => {
        mapping[index] = path.join(dep);
      });
    }
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
    const cfgPath = path.join(this._rootPath, this.getDefaultFileName());
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
    const envPath = path.join(path.dirname(cfgPath), this.getFileName());
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
   * @returns {String[]}
   */
  static get availableFormats() {
    return ['.yml', '.yaml', '.json'];
  }

  /**
   * Glob patterns to exclude matches
   * @returns {String[]}
   * @constructor
   */
  get IGNORE_PATTERNS() {
    return this.getProjectConfig().ignore || ['**/node_modules/**', '**/.terraform/**', '**/.git/**'];
  }
}

module.exports = ConfigLoader;
