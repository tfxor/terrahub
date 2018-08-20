'use strict';

const Args = require('../src/helpers/args-parser');
const AbstractCommand = require('./abstract-command');
const { extend, askQuestion, toMd5 } = require('./helpers/util');

/**
 * @abstract
 */
class TerraformCommand extends AbstractCommand {
  /**
   * Command initialization
   * (post configure action)
   */
  initialize() {
    this
      .addOption('include', 'i', 'List of components to include', Array, [])
      .addOption('exclude', 'x', 'List of components to exclude', Array, [])
      .addOption('var', 'r', 'Variable(s) to be used by terraform', Array, [])
      .addOption('var-file', 'l', 'Variable file(s) to be used by terraform', Array, [])
    ;
  }

  /**
   * @returns {Promise}
   */
  validate() {
    return super.validate().then(() => this._checkProjectDataMissing()).then(() => {
      if (this._isComponentsCountZero()) {
        return Promise.reject('No components defined in configuration file. '
          + 'Please create new component or include existing one with `terrahub component`');
      }

      return Promise.resolve();
    }).then(() => {
      const nonExistingComponents = this._getNonExistingComponents();

      if (nonExistingComponents.length) {
        return Promise.reject('Some of components were not found: ' + nonExistingComponents.join(', '));
      }

      return Promise.resolve();
    }).then(() => {
      const cycle = this._getDependencyCycle();

      if (cycle.length) {
        return Promise.reject('There is a dependency cycle between the following components: ' + cycle.join(', '));
      }

      return Promise.resolve();
    }).catch(err => {
      const error = err.constructor === String ? new Error(err) : err;

      return Promise.reject(error);
    });
  }

  /**
   * @return {Promise}
   * @private
   */
  _checkProjectDataMissing() {
    const projectConfig = this._configLoader.getProjectConfig();
    const missingData = this._getProjectDataMissing(projectConfig);

    if (missingData) {
      return missingData === 'config' ?
        Promise.reject('Configuration file not found. Either re-run the same command ' +
          'in project\'s root or initialize new project with `terrahub project`.') :
        askQuestion(`Global config is missing project ${missingData}. `
          + `Please provide value (e.g. ${missingData === 'code' ?
            this._code(projectConfig.name, projectConfig.provider) : 'terrahub-demo'}): `
        ).then(answer => {

          try {
            this._configLoader.addToGlobalConfig(missingData, answer);
          } catch (error) {
            this.logger.debug(error);
          }

          this._configLoader.updateRootConfig();

          return this._checkProjectDataMissing();
        });
    }

    return Promise.resolve();
  }

  /**
   * @return {String[]}
   * @private
   */
  _getDependencyCycle() {
    const color = {};
    const config = this.getConfigObject();
    const keys = Object.keys(config);
    const path = [];

    keys.forEach(key => color[key] = 'white');
    keys.every(key => color[key] === 'black' ? true : !this._depthFirstSearch(key, path, config, color));

    if (path.length) {
      const index = path.findIndex(it => it === path[path.length - 1]);

      return path.map(key => config[key].name).slice(index + 1);
    }

    return path;
  }

  /**
   * @param {String} hash
   * @param {String[]} path
   * @param {Object} config
   * @param {String[]} color
   * @return {Boolean}
   * @private
   */
  _depthFirstSearch(hash, path, config, color) {
    const dependsOn = config[hash].dependsOn;
    color[hash] = 'gray';
    path.push(hash);

    for (const key in dependsOn) {
      if (color[key] === 'white') {
        if (this._depthFirstSearch(key, path, config, color)) {
          return true;
        }
      }

      if (color[key] === 'gray') {
        path.push(key);

        return true;
      }
    }

    color[hash] = 'black';
    path.pop();

    return false;
  }

  /**
   * Get extended config via CLI
   * @returns {Object}
   */
  getExtendedConfig() {
    const result = {};
    const config = super.getConfig();
    const cliParams = {
      terraform: {
        var: this.getVar(),
        varFile: this.getVarFile()
      }
    };

    Object.keys(config).forEach(hash => {
      result[hash] = extend(config[hash], [cliParams, { hash: hash }]);
    });

    return result;
  }

  /**
   * Get filtered config
   * @returns {Object}
   */
  getConfig() {
    const config = this.getExtendedConfig();
    const include = this.getIncludes();

    if (include.length > 0) {
      Object.keys(config).forEach(hash => {
        if (!include.includes(config[hash].name)) {
          delete config[hash];
        }
      });
    }

    return config;
  }

  /**
   * @returns {Array}
   */
  getIncludes() {
    return this.getOption('include');
  }

  /**
   * @returns {Array}
   */
  getVarFile() {
    return this.getOption('var-file');
  }

  /**
   * @returns {Object}
   */
  getVar() {
    let result = {};

    this.getOption('var').map(item => {
      Object.assign(result, Args.toObject(item));
    });

    return result;
  }

  /**
   * Get object of components' configuration
   * @return {Object}
   */
  getConfigObject() {
    const tree = {};
    const object = Object.assign({}, this.getConfig());

    Object.keys(object).forEach(hash => {
      const node = Object.assign({}, object[hash]);
      const dependsOn = {};

      node.dependsOn.forEach(dep => {
        const key = toMd5(dep);

        if (!object.hasOwnProperty(key)) {
          throw new Error(`Couldn't find dependency '${dep}'`);
        }

        dependsOn[key] = null;
      });

      node.dependsOn = dependsOn;
      tree[hash] = node;
    });

    return tree;
  }

  /**
   * Return name of the required field missing in project data
   * @param {Object} projectConfig
   * @return {String|null}
   * @private
   */
  _getProjectDataMissing(projectConfig) {
    if (!projectConfig.hasOwnProperty('root')) {
      return 'config';
    }

    if (!projectConfig.hasOwnProperty('name')) {
      return 'name';
    }

    if (!projectConfig.hasOwnProperty('code')) {
      return 'code';
    }

    return null;
  }

  /**
   * @param {String} name
   * @param {String} provider
   * @return {String}
   * @private
   */
  _code(name, provider) {
    return toMd5(name + provider).slice(0, 8);
  }

  /**
   * @returns {Boolean}
   * @private
   */
  _isComponentsCountZero() {
    return (this._configLoader.componentsCount() === 0);
  }

  /**
   * @return {String[]}
   * @private
   */
  _getNonExistingComponents() {
    const cfg = this.getExtendedConfig();
    const names = Object.keys(cfg).map(hash => cfg[hash].name);

    return this.getIncludes().filter(includeName => !names.includes(includeName));
  }
}

module.exports = TerraformCommand;
