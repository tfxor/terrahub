'use strict';

const Args = require('../src/helpers/args-parser');
const AbstractCommand = require('./abstract-command');
const { extend, askQuestion, toMd5 } = require('./helpers/util');
const { execSync } = require('child_process');
const { lstatSync } = require('fs');
const { join } = require('path');

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
      .addOption('silent', 's', 'Runs the command without additional output', Boolean, false)
      .addOption('git-diff', 'g', 'To be updated', Array, [])
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
      // hash is required in distributor to remove components from dependency table
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
    const exclude = this.getExcludes();
    const gitDiff = this.getGitDiff();

    if (gitDiff.length > 0) {
      Object.keys(config).forEach(hash => {
        if (!gitDiff.includes(config[hash].name)) {
          delete config[hash];
        }
      });
    }

    if (include.length > 0) {
      Object.keys(config).forEach(hash => {
        if (!include.includes(config[hash].name)) {
          delete config[hash];
        }
      });
    }

    if (exclude.length > 0) {
      Object.keys(config).forEach(hash => {
        if (exclude.includes(config[hash].name)) {
          delete config[hash];
        }
      });
    }

    if (!Object.keys(config).length) {
      throw new Error(`No components available for the '${this.getName()}' action.`);
    }

    return config;
  }

  /**
   * @returns {String[]}
   */
  getIncludes() {
    return this.getOption('include');
  }

  /**
   * @return {String[]}
   */
  getExcludes() {
    return this.getOption('exclude');
  }

  /**
   * Get Project CI mapping
   * @return {Object}
   */
  getProjectCi() {
    return this._configLoader.getProjectCi();
  }

  /**
   * @return {String[]}
   */
  getGitDiff() {
    const commits = this.getOption('git-diff');

    if (!commits.length) {
      return [];
    }

    if (commits.length > 2) {
      throw new Error('Invalid \'--git-diff\' option format! More than two arguments specified!');
    }

    const stdout = execSync(`git diff ${commits.join(' ')} --name-only`, { cwd: this.getAppPath() });
    const diffList = stdout.toString().split('\n').slice(0, -1).map(it => join(this.getAppPath(), it));

    if (!diffList.length) {
      return [];
    }

    const config = super.getConfig();
    const projectCiMapping = this.getProjectCi() ? this.getProjectCi().mapping : [];

    const isAll = (projectCiMapping || []).some(dep => {
      const stat = lstatSync(dep);

      if (stat.isFile()) {
        return diffList.some(diff => dep === diff);
      }

      if (stat.isDirectory()) {
        return diffList.some(diff => diff.includes(dep));
      }

      return false;
    });

    if (isAll) {
      return Object.keys(config).map(key => config[key].name);
    }

    const runList = [];

    Object.keys(config).forEach(hash => {
      const cfg = config[hash];

      if ('ci' in cfg && 'mapping' in cfg['ci'] &&
        cfg.ci.mapping.some(dep => {
          const stat = lstatSync(dep);

          if (stat.isFile()) {
            return diffList.some(diff => dep === diff);
          }

          if (stat.isDirectory()) {
            return diffList.some(diff => diff.includes(dep));
          }

          return false;
        })) {
        runList.push(cfg.name);
      }
    });

    return runList;
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

        dependsOn[key] = null;
      });

      node.dependsOn = dependsOn;
      tree[hash] = node;
    });

    return tree;
  }

  /**
   * Checks if there is a cycle between dependencies included in the config
   * @param {Object} config
   * @return {Promise}
   */
  checkDependencyCycle(config) {
    const cycle = this._getDependencyCycle(config);

    if (cycle.length) {
      return Promise.reject('There is a dependency cycle between the following components: ' + cycle.join(', '));
    }

    return Promise.resolve();
  }

  /**
   * @return {String[]}
   * @param {Object} config
   * @private
   */
  _getDependencyCycle(config) {
    const color = {};
    const keys = Object.keys(config);
    const path = [];

    keys.forEach(key => color[key] = TerraformCommand.WHITE);
    keys.every(key => color[key] === TerraformCommand.BLACK ? true : !this._depthFirstSearch(key, path, config, color));

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
   * @param {Number[]} color
   * @return {Boolean}
   * @private
   */
  _depthFirstSearch(hash, path, config, color) {
    const dependsOn = config[hash].dependsOn;
    color[hash] = TerraformCommand.GRAY;
    path.push(hash);

    for (const key in dependsOn) {
      if (color[key] === TerraformCommand.WHITE) {
        if (this._depthFirstSearch(key, path, config, color)) {
          return true;
        }
      }

      if (color[key] === TerraformCommand.GRAY) {
        path.push(key);

        return true;
      }
    }

    color[hash] = TerraformCommand.BLACK;
    path.pop();

    return false;
  }

  /**
   * Checks if all components' dependencies are included in config
   * @param {Object} config
   * @return {Promise}
   */
  checkDependencies(config) {
    const fullConfig = this.getExtendedConfig();

    for (let hash in config) {
      const node = config[hash];

      for (let dep in node.dependsOn) {
        const depNode = fullConfig[dep];

        if (!(dep in config)) {
          return Promise.reject(new Error(`Couldn't find dependency '${depNode.name}' of '${node.name}' component.`));
        }
      }
    }

    return this.checkDependencyCycle(config);
  }

  /**
   * Checks if all components that depend on the components included in run are included in config
   * @param {Object} config
   * @return {Promise}
   */
  checkDependenciesReverse(config) {
    const fullConfig = this.getExtendedConfig();

    for (let hash in config) {
      const node = config[hash];

      for (let key in fullConfig) {
        const depNode = fullConfig[key];
        const dependsOn = depNode.dependsOn.map(it => toMd5(it));

        if (dependsOn.includes(hash) && !(key in config)) {
          return Promise.reject(new Error(`Couldn't find component '${depNode.name}' ` +
            `that depends on '${node.name}'.`));
        }
      }
    }

    return this.checkDependencyCycle(config);
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

  /**
   * @return {Number}
   * @private
   */
  static get BLACK() { return 0; }

  /**
   * @return {Number}
   * @private
   */
  static get WHITE() { return 1; }

  /**
   * @return {Number}
   * @private
   */
  static get GRAY() { return 2; }
}

module.exports = TerraformCommand;
