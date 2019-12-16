'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const fse = require('fs-extra');
const Dictionary = require('./helpers/dictionary');
const ListException = require('./exceptions/list-exception');
const {
  toMd5, extend, yamlToJson, jsonToYaml
} = require('./helpers/util');

class ConfigLoader {
  /**
   * Constructor
   * @param {Object} config
   */
  constructor(config) {
    this._config = {};
    this._terrahubConfig = config.config;
    this._rootPath = false;
    this._rootConfig = {};
    this._projectConfig = {};
    this._format = '.' + this._terrahubConfig.format;

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
  _componentDefaults() {
    return {
      cfgEnv: this._terrahubConfig.env,
      project: this.getProjectConfig(),
      hook: {},
      build: {},
      mapping: [],
      children: [],
      terraform: {},
      dependsOn: [],
      env: { variables: {} }
    };
  }

  /**
   * Project default config
   * @return {Object}
   * @private
   */
  _projectDefaults() {
    return {
      root: this._rootPath,
      include: [],
      exclude: []
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
      this._fileName = this._terrahubConfig.isDefault
        ? `.terrahub${this._format}`
        : `.terrahub.${this._terrahubConfig.env}${this._format}`;
      this._defaultFileName = `.terrahub${this._format}`;
      this._rootPath = path.dirname(configFile);
      this._rootConfig = extend({}, [this._defaults(), this._getConfig(configFile)]);
      this._projectConfig = Object.assign(this._projectDefaults(), this._rootConfig['project']);
      this._projectDistributor = this._rootConfig['project'].distributor;

      this._handleProjectConfig();

      delete this._rootConfig['project'];
    } else {
      this._rootPath = false;
      this._rootConfig = {};
      this._projectConfig = {};
    }
  }

  /**
   * @return {Object}
   * @private
   */
  _defaults() {
    return {
      terraform: {
        var: {},
        varFile: [],
        backend: {},
        version: '0.12.18',
        backup: false,
        workspace: 'default'
      }
    };
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
        searchPattern = `**/.terrahub.${this._terrahubConfig.env}.+(json|yml|yaml)`;
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

        delete this._rootConfig[key];

        this._processComponentConfig(cfg, root);
        const hash = ConfigLoader.buildComponentHash(root);
        this._config[hash] = extend({}, [this._componentDefaults(), this._rootConfig, cfg]);
      }
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
      const componentHash = ConfigLoader.buildComponentHash(componentPath);

      // Delete in case of delete
      config = Object.assign(config, config.component);

      this._validateComponentConfig(config);
      this._processComponentConfig(config, componentPath);

      this._config[componentHash] = extend(
        { root: componentPath }, [this._componentDefaults(), this._rootConfig, config]);
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
   * Validate's components' config fields'
   * @param {Object} config
   * @private
   */
  _validateComponentConfig(config) {
    if (!config.hasOwnProperty('mapping')) {
      config.mapping = [];
    }

    if (!config.hasOwnProperty('distributor')) {
      config.distributor = this._projectDistributor || 'local';
    }
  }

  /**
   * @param {Object} config
   * @throws {Error}
   * @private
   */
  _validateDynamicData(config) {
    if (config.hasOwnProperty('template') && config.template.hasOwnProperty('dynamic')) {
      const dynamicRemoteStates = config.template.dynamic.data.terraform_remote_state;
      const regexExists = new RegExp(`[*]`, 'm');
      let names = dynamicRemoteStates.map(it => it.component);
      names.forEach((it, i) => {
        if (regexExists.test(it)) {
          const test = it.replace('*', '');
          const regex = new RegExp(test, 'm');
          names.splice(i, 1);

          names = [...config.dependsOn.filter(it => regex.test(it) && !names.includes(it)), ...names];
        }
      });

      const errors = names.filter(it => !config.dependsOn.includes(it));
      if (errors.length) {
        throw new Error(`Component${errors.length > 1 ? '\'s' : ''} '${errors.join(`', '`)}' from ` +
          `dynamic terraform_remote_state doesn't exist in dependsOn of the '${config.name}' component.`);
      }
    }
  }

  /**
   * @param {Object} config
   * @param {String} componentPath
   * @private
   */
  _processComponentConfig(config, componentPath) {
    if (config.hasOwnProperty('dependsOn')) {
      if (!Array.isArray(config.dependsOn)) {
        throw new Error(`Error in component's configuration! DependsOn of '${config.name}' must be an array!`);
      }
    }

    if (config.hasOwnProperty('mapping')) {
      if (!Array.isArray(config.mapping)) {
        throw new Error(`Error in component's configuration! CI Mapping of '${config.name}' must be an array!`);
      }

      config.mapping.push('.');
      config.mapping = [...new Set(config.mapping.map(it => path.join(componentPath, it)))];
    }

    if (config.hasOwnProperty('distributor')) {
      const distributors = ['local', 'lambda', 'fargate', 'appEngine', 'cloudFunctions'];

      if (!distributors.includes(config.distributor)) {
        throw new Error(`Error in component's configuration! Unknown distributor.`);
      }
    }

    this._validateDynamicData(config);

    if (config.hasOwnProperty('env')) {
      ['hook', 'build'].filter(key => !!config[key]).forEach(key => {
        if (!config[key].env) {
          config[key].env = {};
        }

        config[key].env.variables = { ...config.env.variables, ...config[key].env.variables};
      });
    }

    ['env', 'component'].forEach(key => delete config[key]);
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
   * Find files by pattern
   * @param {String} pattern
   * @param {String} path
   * @returns {String[]}
   * @private
   */
  _find(pattern, path) {
    return glob.sync(pattern, {
      cwd: path, absolute: true, dot: true, ignore: this.ignorePatterns
    });
  }

  /**
   * @param {String} fullPath
   * @returns {*}
   */
  relativePath(fullPath) {
    return path.relative(this.appPath(), fullPath);
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
    const forceWorkspace = { terraform: { workspace: this._terrahubConfig.env } }; // Just remove to revert
    const overwrite = (objValue, srcValue) => {
      if (Array.isArray(objValue)) {
        return srcValue;
      }
    };
    return (!this._terrahubConfig.isDefault && fs.existsSync(envPath))
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
   * Default glob patterns to exclude matches
   * @return {String[]}
   */
  static get defaultIgnorePatterns() {
    return ['**/node_modules/**', '**/.terraform/**', '**/.git/**'];
  }

  /**
   * Build component hash
   * @param {String} relativePath
   * @returns {String}
   */
  static buildComponentHash(relativePath) {
    return toMd5(relativePath);
  }

  /**
   * Glob patterns to exclude matches
   * @returns {String[]}
   * @constructor
   */
  get ignorePatterns() {
    return this.getProjectConfig().ignore || ConfigLoader.defaultIgnorePatterns;
  }
}

module.exports = ConfigLoader;
