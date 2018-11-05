'use strict';

const Args = require('../src/helpers/args-parser');
const AbstractCommand = require('./abstract-command');
const { extend, askQuestion, toMd5 } = require('./helpers/util');
const { execSync } = require('child_process');
const { lstatSync } = require('fs');
const { join } = require('path');
const os = require('os');
const treeify = require('treeify');

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
      .addOption('include', 'i', 'List of components to include (comma separated values)', Array, [])
      .addOption('exclude', 'x', 'List of components to exclude (comma separated values)', Array, [])
      .addOption('include-regex', 'I', 'List of components to include (regex search)', Array, [])
      .addOption('exclude-regex', 'X', 'List of components to exclude (regex search)', Array, [])
      .addOption('git-diff', 'g', 'List of components to include (git diff)', Array, [])
      .addOption('var', 'r', 'Variable(s) to be used by terraform', Array, [])
      .addOption('var-file', 'l', 'Variable file(s) to be used by terraform', Array, [])
      .addOption('silent', 's', 'Runs the command silently (without any output)', Boolean, false)
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
    const includeRegex = this.getIncludesRegex();
    const excludeRegex = this.getExcludesRegex();
    const gitDiff = this.getGitDiff();

    if (gitDiff.length > 0) {
      Object.keys(config).forEach(hash => {
        if (!gitDiff.includes(config[hash].name)) {
          delete config[hash];
        }
      });
    }

    if (includeRegex.length > 0) {
      Object.keys(config).forEach(hash => {
        if (!includeRegex.some(regex => regex.test(config[hash].name))) {
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

    if (excludeRegex.length > 0) {
      Object.keys(config).forEach(hash => {
        if (excludeRegex.some(regex => regex.test(config[hash].name))) {
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
   * @returns {RegExp[]}
   */
  getIncludesRegex() {
    return this.getOption('include-regex').map(it => new RegExp(it));
  }

  /**
   * @returns {RegExp[]}
   */
  getExcludesRegex() {
    return this.getOption('exclude-regex').map(it => new RegExp(it));
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
    } else if (commits.length > 2) {
      throw new Error('Invalid \'--git-diff\' option format! More than two arguments specified!');
    }

    let stdout;
    try {
      stdout = execSync(`git diff --name-only ${commits.join(' ')}`, { cwd: this.getAppPath(), stdio: 'pipe' });
    } catch (error) {
      this._handleGitDiffError(error);
    }

    if (!stdout || !stdout.toString().length) {
      throw new Error('There are no changes between commits, commit and working tree, etc.');
    }

    const diffList = stdout.toString().split(os.EOL).slice(0, -1).map(it => join(this.getAppPath(), it));

    if (!diffList.length) {
      return [];
    }

    const config = super.getConfig();
    const projectCiMapping = this.getProjectCi() ? (this.getProjectCi().mapping || []) : [];

    const isAll = projectCiMapping.some(dep => this._compareCiMappingToGitDiff(dep, diffList));

    if (isAll) {
      return Object.keys(config).map(key => config[key].name);
    }

    const runList = [];

    Object.keys(config).forEach(hash => {
      const cfg = config[hash];

      if ('ci' in cfg && 'mapping' in cfg['ci'] &&
        cfg.ci.mapping.some(dep => this._compareCiMappingToGitDiff(dep, diffList))
      ) {
        runList.push(cfg.name);
      }
    });

    return runList;
  }

  /**
   * @param {Error} error
   * @private
   */
  _handleGitDiffError(error) {
    this.logger.debug(error);
    let err = error;

    if (error.stderr) {
      const stderr = error.stderr.toString();

      if (/not found/.test(stderr)) {
        err = new Error('Git is not installed on this device.');
      } else if (/Not a git repository/.test(stderr)) {
        err = new Error(`Git repository not found in '${this.getAppPath()}'`);
      }
    }

    throw err;
  }

  /**
   * @param {String} dep
   * @param {Array} diffList
   * @return {Boolean}
   * @private
   */
  _compareCiMappingToGitDiff(dep, diffList) {
    const stat = lstatSync(dep);

    if (stat.isFile()) {
      return diffList.some(diff => dep === diff);
    }

    if (stat.isDirectory()) {
      return diffList.some(diff => diff.includes(dep));
    }

    return false;
  }

  /**
   * @param {String} config
   * @return {Boolean}
   * @private
   */
  printConfigAsList(config) {
    const componentList = {};

    Object.keys(config).map(key => componentList[config[key].name] = null);

    const { name } = this.getProjectConfig();
    this.logger.log(`Project: ${name}`);

    treeify.asLines(componentList, false, line => {
      this.logger.log(` ${line}`);
    });
  }

  printConfigCommaSeparated(config) {
    const componentList = {};

    Object.keys(config).map(key => componentList[config[key].name] = null);
    
    const components = Object.keys(componentList).join(', ');
    const { name } = this.getProjectConfig();

    this.logger.log(`Project: ${name} | Component${components.length > 1 ? 's' : ''} : ${components}`);
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
   * @private
   */
  _checkDependencyCycle(config) {
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
   * @param {Number} direction
   * @return {Promise}
   */
  checkDependencies(config, direction = TerraformCommand.FORWARD) {
    const issues = [];

    switch (direction) {
      case TerraformCommand.FORWARD:
        issues.push(...this.getDependencyIssues(config));
        break;

      case TerraformCommand.REVERSE:
        issues.push(...this.getReverseDependencyIssues(config));
        break;

      case TerraformCommand.BIDIRECTIONAL:
        issues.push(...this.getDependencyIssues(config), ...this.getReverseDependencyIssues(config));
        break;
    }

    if (issues.length) {
      const errorStrings = issues.map((it, index) => `${index + 1}. ${it}`);
      errorStrings.unshift('TerraHub failed because of the following issues:');

      return Promise.reject(new Error(errorStrings.join(os.EOL)));
    }

    return this._checkDependencyCycle(config);
  }

  /**
   * Returns an array of error strings related to
   * all components' dependencies are included in config
   * @param {Object} config
   * @return {String[]}
   */
  getDependencyIssues(config) {
    const fullConfig = this.getExtendedConfig();
    const issues = [];

    Object.keys(config).forEach(hash => {
      const node = config[hash];

      const issueDependencies = Object.keys(node.dependsOn).filter(it => !(it in config));

      issueDependencies.forEach(it => {
        if (it in fullConfig) {
          const name = fullConfig[it].name;

          issues.push(`'${node.name}' component depends on '${name}' that is excluded from execution list`);
        } else {
          const dir = fullConfig[hash].dependsOn.find(dep => toMd5(dep) === it);

          issues.push(`'${node.name}' component depends on the component in '${dir}' directory that doesn't exist`);
        }
      });
    });

    return issues;
  }

  /**
   * Returns an array of error strings related to
   * components that depend on the components included in run are included in config
   * @param {Object} config
   * @return {String[]}
   */
  getReverseDependencyIssues(config) {
    const fullConfig = this.getExtendedConfig();
    const issues = [];

    const keys = Object.keys(fullConfig).filter(key => !(key in config));

    keys.forEach(hash => {
      const depNode = fullConfig[hash];
      const dependsOn = depNode.dependsOn.map(path => toMd5(path));

      const issueNodes = dependsOn.filter(it => (it in config)).map(it => `'${fullConfig[it].name}'`).join(', ');

      issues.push(`'${fullConfig[hash].name}' component that depends on ${issueNodes} ` +
        `component${issueNodes.length > 1 ? 's' : ''} is excluded from the execution list`);
    });

    return issues;
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

  /**
   * @return {Number}
   */
  static get FORWARD() { return 0; }

  /**
   * @return {Number}
   */
  static get REVERSE() { return 1; }

  /**
   * @return {Number}
   */
  static get BIDIRECTIONAL() { return 0; }
}

module.exports = TerraformCommand;
