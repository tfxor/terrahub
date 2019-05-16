'use strict';

const Util = require('./helpers/util');
const Args = require('./helpers/args-parser');
const ConfigLoader = require('./config-loader');
const GitHelper = require('./helpers/git-helper');
const Dictionary = require('./helpers/dictionary');
const AbstractCommand = require('./abstract-command');
const { config: { listLimit } } = require('./parameters');
const ListException = require('./exceptions/list-exception');
const DependencyAuto = require('./helpers/dependency-strategies/dependency-auto');
const DependencyIgnore = require('./helpers/dependency-strategies/dependency-ignore');
const DependencyInclude = require('./helpers/dependency-strategies/dependency-include');

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
      .addOption('dependency', 'd', 'Configure dependency validation', String, 'auto')
    ;
  }

  /**
   * @returns {Promise}
   */
  validate() {
    return super.validate().then(() => this._checkProjectDataMissing()).then(() => {
      if (this._isComponentsCountZero() && this.getName() !== 'configure') {
        throw new Error('No components defined in configuration file. '
          + 'Please create new component or include existing one with `terrahub component`');
      }

      return Promise.resolve();
    }).then(() => {
      const nonExistingComponents = this._getNonExistingComponents();

      if (nonExistingComponents.length) {
        throw new Error('Some of components were not found: ' + nonExistingComponents.join(', '));
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
    const missingData = ['root', 'name', 'code'].find(it => !projectConfig[it]);

    if (!missingData) {
      return Promise.resolve();
    } else if (missingData === 'root') {
      throw new Error('Configuration file not found. Either re-run the same command ' +
        'in project\'s root or initialize new project with `terrahub project`.');
    } else {
      return Util.askQuestion(`Global config is missing project ${missingData}. Please provide value` +
        `(e.g. ${missingData === 'code' ? this.getProjectCode(projectConfig.name) : 'terrahub-demo'}): `
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
      result[hash] = Util.extend(config[hash], [cliParams, { hash: hash }]);
    });

    this._checkDependenciesExist(result);

    Object.keys(result).forEach(hash => {
      const node = result[hash];
      const dependsOn = node.dependsOn.map(ConfigLoader.buildComponentHash);

      node.dependsOn = Util.arrayToObject(dependsOn);
    });

    return result;
  }

  /**
   * Get filtered config
   * @returns {Object}
   */
  getFilteredConfig() {
    const config = this.getExtendedConfig();
    const gitDiff = this.getGitDiff();
    const includeRegex = this.getIncludesRegex();
    const include = this.getIncludes();
    const excludeRegex = this.getExcludesRegex();
    const exclude = this.getExcludes();

    const filters = [
      gitDiff.length ? hash => gitDiff.includes(hash) : null,
      includeRegex.length ? hash => includeRegex.some(regex => regex.test(config[hash].name)) : null,
      include.length ? hash => include.includes(config[hash].name) : null,
      excludeRegex.length ? hash => !excludeRegex.some(regex => regex.test(config[hash].name)) : null,
      exclude.length ? hash => !exclude.includes(config[hash].name) : null
    ].filter(Boolean);

    Object.keys(config)
      .filter(hash => filters.some(check => !check(hash)))
      .forEach(hash => { delete config[hash]; });

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
   * @description Returns an array of hashes to include in the execution
   * @return {String[]}
   */
  getGitDiff() {
    const commits = this.getOption('git-diff');

    if (!commits.length) {
      return [];
    } else if (commits.length > 2) {
      throw new Error('Invalid \'--git-diff\' option format! More than two arguments specified!');
    }

    const diffList = GitHelper.getGitDiff(commits, this.getAppPath());

    const config = super.getConfig();
    const result = {};

    Object.keys(config)
      .filter(hash => {
        const { mapping } = config[hash];

        return mapping && mapping.some(dep => diffList.some(diff => diff.startsWith(dep)));
      })
      .forEach(hash => { result[hash] = null; });

    // Add components' dependencies to the execution list
    let newHashes = Object.keys(result);

    while (newHashes.length) {
      const componentHash = newHashes.pop();
      const { dependsOn } = config[componentHash];

      dependsOn
        .map(path => ConfigLoader.buildComponentHash(path))
        .filter(hash => !result.hasOwnProperty(hash))
        .forEach(hash => {
          newHashes.push(hash);
          result[hash] = null;
        });
    }

    return Object.keys(result);
  }

  /**
   * @description Returns config with applied dependency strategy
   * @param {Object} config
   * @param {Object} fullConfig
   * @param {String[]} dependencies
   * @return {Object}
   */
  getDependency(config, fullConfig, dependencies) {
    const option = this.getOption('dependency');
    let strategy;

    switch (option) {
      case 'auto':
        strategy = new DependencyAuto(config, fullConfig, null);
        break;
      case 'ignore':
        strategy = new DependencyIgnore(config, fullConfig, dependencies);
        break;
      case 'include':
        strategy = new DependencyInclude(config, fullConfig, dependencies);
        break;
    }

    return strategy.execute();
  }


  /**
   * @param {Object|Array} config
   * @param {Boolean} autoApprove
   * @param {String} customQuestion
   * @return {Promise}
   */
  askForApprovement(config, autoApprove = false, customQuestion = '') {
    Util.printListAuto(config, this.getProjectConfig().name, listLimit);

    const action = this.getName();

    if (autoApprove) {
      this.logger.log(`Option 'auto-approve' is enabled, therefore '${action}' ` +
        `action is executed with no confirmation.`);

      return Promise.resolve(true);
    }

    const defaultQuestion = `Do you want to perform 'terrahub ${action}' action? (y/N) `;

    return Util.yesNoQuestion(customQuestion || defaultQuestion);
  }

  /**
   * @param {Object|Array} config
   */
  warnExecutionStarted(config) {
    Util.printListAuto(config, this.getProjectConfig().name, listLimit);

    const action = this.getName();

    this.logger.warn(`'terrahub ${action}' action is executed for above list of components.`);
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
   * Check all components dependencies existence
   * @param {Object} config
   */
  _checkDependenciesExist(config) {
    const fullConfig = this.getExtendedConfig();
    const issues = {};

    Object.keys(config).forEach(hash => {
      const node = config[hash];
      
      issues[hash] = node.dependsOn.filter(dep => {
        const key = ConfigLoader.buildComponentHash(dep);

        return !fullConfig.hasOwnProperty(key);
      });
      });

    const messages = Object.keys(issues).filter(it => issues[it].length).map(it => {
      return `'${config[it].name}' component depends on the component in '${issues[it].join(`', '`)}' `+
        `director${issues[it].length > 1 ? 'ies' : 'y'} that doesn't exist`
    });

    if (messages.length) {
      throw new ListException(messages, {
        header: 'TerraHub failed because of the following issues:',
        style: ListException.NUMBER
      });
    }
  }

  /**
   * Checks if there is a cycle between dependencies included in the config
   * @param {Object} config
   * @throws {Error}
   * @private
   */
  _checkDependencyCycle(config) {
    const keys = Object.keys(config);
    const path = [];
    const color = {};

    /**
     * @param {String} hash
     * @throws {Error}
     */
    const depthFirstSearch = hash => {
      const { dependsOn } = config[hash];

      color[hash] = Dictionary.COLOR.GRAY;
      path.push(hash);

      Object.keys(dependsOn).forEach(dependency => {
        switch (color[dependency]) {
          case Dictionary.COLOR.WHITE:
            depthFirstSearch(dependency);
            break;

          case Dictionary.COLOR.GRAY:
            const cycleStartIndex = path.indexOf(dependency);
            const cycle = path.slice(cycleStartIndex).map(it => config[it].name);

            throw new Error('There is a dependency cycle between the following components: ' + cycle.join(', '));
        }
      });

      color[hash] = Dictionary.COLOR.BLACK;
      path.pop();
    };

    keys.forEach(key => { color[key] = Dictionary.COLOR.WHITE; });

    // "if" statement is used instead of "Array::filter" because color is changed dynamically in the cycle
    keys.forEach(key => {
      if (color[key] !== Dictionary.COLOR.BLACK) {
        depthFirstSearch(key);
      }
    });
  }

  /**
   * Checks if all components' dependencies are included in config
   * @param {Object} config
   * @param {Number} direction
   */
  checkDependencies(config, direction = Dictionary.DIRECTION.FORWARD) {
    let issues;

    switch (direction) {
      case Dictionary.DIRECTION.FORWARD:
        issues = this.getDependencyIssues(config);
        break;

      case Dictionary.DIRECTION.REVERSE:
        issues = this.getReverseDependencyIssues(config);
        break;

      case Dictionary.DIRECTION.BIDIRECTIONAL:
        issues = [...this.getDependencyIssues(config), ...this.getReverseDependencyIssues(config)];
        break;
    }

    if (issues.length) {
      throw new ListException(issues, {
        header: 'TerraHub failed because of the following issues:',
        style: ListException.NUMBER
      });
    }

    this._checkDependencyCycle(config);
  }

  /**
   * Returns an array of error strings related to
   * all components' dependencies are included in config
   * @param {Object} config
   * @return {String[]}
   */
  getDependencyIssues(config) {
    const fullConfig = this.getExtendedConfig();
    const hashesToCheck = Object.keys(config);
    const checked = Object.assign({}, config);
    const issues = {};

    Object.keys(fullConfig).forEach(it => { issues[it] = []; });

    while (hashesToCheck.length) {
      const hash = hashesToCheck.pop();
      const { dependsOn } = fullConfig[hash];

      dependsOn
        .map(path => ConfigLoader.buildComponentHash(path))
        .filter(it => !config.hasOwnProperty(it))
        .forEach(it => {
          issues[hash].push(it);

          if (!checked.hasOwnProperty(it)) {
            checked[it] = null;
            hashesToCheck.push(it);
          }
        });
    }

    return Object.keys(issues).filter(hash => issues[hash].length).map(hash => {
      const names = issues[hash].map(it => fullConfig[it].name);

      return `'${fullConfig[hash].name}' component depends on ${names.map(it => `'${it}'`).join(', ')} ` +
        `that ${names.length > 1 ? 'are' : 'is'} excluded from execution list`;
    });
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

    const keys = Object.keys(fullConfig).filter(key => !config.hasOwnProperty(key));

    keys.forEach(hash => {
      const depNode = fullConfig[hash];
      const dependsOn = depNode.dependsOn.map(path => ConfigLoader.buildComponentHash(path));

      const issueNodes = dependsOn.filter(it => config.hasOwnProperty(it))
        .map(it => `'${fullConfig[it].name}'`).join(', ');

      if (issueNodes.length) {
        issues.push(`'${fullConfig[hash].name}' component that depends on ${issueNodes} ` +
          `component${issueNodes.length > 1 ? 's' : ''} is excluded from the execution list`);
      }
    });

    return issues;
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
   *
   * @param {Object} config
   * @return {String[]}
   */
  buildComponentList(config) {
    return Object.keys(config).map(key => config[key].name);
  }
}

module.exports = TerraformCommand;
