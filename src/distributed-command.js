'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const Util = require('./helpers/util');
const Args = require('./helpers/args-parser');
const ConfigLoader = require('./config-loader');
const getPropertyFromPath = require('lodash.get');
const GitHelper = require('./helpers/git-helper');
const LogHelper = require('./helpers/log-helper');
const Dictionary = require('./helpers/dictionary');
const AbstractCommand = require('./abstract-command');
const ListException = require('./exceptions/list-exception');

const DependenciesAuto = require('./helpers/dependency-strategy/dependencies-auto');
const DependenciesIgnore = require('./helpers/dependency-strategy/dependencies-ignore');
const DependenciesInclude = require('./helpers/dependency-strategy/dependencies-include');

class DistributedCommand extends AbstractCommand {

  /**
   * @param {Object} parameters
   * @param {Logger} logger
   */
  constructor(parameters, logger) {
    super(parameters, logger);

    this._terraformRemoteStates = {};
    this._runId = Util.uuid();

    this.logger.updateContext({
      runId: this._runId,
      componentName: 'main',
      action: 'main'
    });
  }

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
      .addOption('dependency', 'p', 'Set dependency validation strategy (auto, ignore, include)', String, 'auto');
  }

  /**
   * @returns {Promise}
   */
  async validate() {
    try {
      this._tokenIsValid = await super.validate();

      if (this._tokenIsValid && this.terrahubCfg.logs) { this.logger.updateContext({ canLogBeSentToApi: true }); }
      if (!this._tokenIsValid) { this.checkCloudAccountRequirements(this.getExtendedConfig()); }

      await this._checkProjectDataMissing();

      if (this._isComponentsCountZero() && this.getName() !== 'configure') {
        throw new Error('No components defined in configuration file. '
          + 'Please create new component or include existing one with `terrahub component`');
      }

      const nonExistingComponents = this._getNonExistingComponents();

      if (nonExistingComponents.length) {
        throw new Error('Some of components were not found: ' + nonExistingComponents.join(', '));
      }

      return this._checkProjectDuplicateComponents();
    } catch (err) {

      const error = err.constructor === String ? new Error(err) : err;

      return Promise.reject(error);
    }
  }

  /**
   * @return {String}
   */
  get runId() {
    return this._runId;
  }

  /**
   * @returns {Promise}
   * @private
   */
  _checkProjectDuplicateComponents() {
    const fullConfig = this.getExtendedConfig();
    const result = {};

    Object.keys(fullConfig).forEach(hash => {
      const { name, root } = fullConfig[hash];

      if (result.hasOwnProperty(name)) {
        result[name].push(root);
      } else {
        result[name] = [root];
      }
    });

    const duplicates = Object.keys(result).filter(it => result[it].length > 1);

    if (duplicates.length) {
      const messages = duplicates.map(it => `component '${it}' ` +
        `has duplicates in '${result[it].join(`' ,'`)}' directories`);

      throw new ListException(messages, {
        header: 'Some components have duplicates in project:',
        style: ListException.NUMBER
      });
    }

    return Promise.resolve();
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
   * Get extended config object
   * @returns {Object}
   */
  getExtendedConfig() {
    if (!this._extendedConfig) {
      this._extendedConfig = this._initExtendedConfig();
    }

    return this._extendedConfig;
  }

  /**
   * Initialize extended config
   * @returns {Object}
   */
  _initExtendedConfig() {
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

    this._processRemoteStates(result);
    this._checkDependenciesExist(result);
    this._processDependencies(result);

    return result;
  }

  /**
   * @param {Object} config
   * @private
   */
  _processRemoteStates(config) {
    Object.keys(config).forEach(hash => {
      const node = config[hash];

      if (node.hasOwnProperty('template') && node.template.hasOwnProperty('dynamic')) {
        const regexExists = new RegExp(`[*]`, 'm');
        const dynamicRemoteStates = node.template.dynamic.data.terraform_remote_state;
        this._terraformRemoteStates[hash] = [];

        dynamicRemoteStates.forEach(it => {
          const { name, provider, component, workspace } = it;

          if (regexExists.test(component)) {
            const regex = new RegExp(component.replace('*', ''), 'm');
            const include = config[hash].dependsOn.filter(
              it => regex.test(it) && !dynamicRemoteStates.some(data => data.component === it));

            include.forEach(it => {
              const defaultObj = {
                component: it,
                name: `${name.replace('*', it)}`,
                ...(workspace && { workspace: workspace }),
                ...(provider && { provider: provider })
              };

              this._terraformRemoteStates[hash].push(defaultObj);
            });
          } else {
            this._terraformRemoteStates[hash].push(it);
          }
        });

        delete node.template.dynamic;
      }
    });
  }

  /**
   * @param {Object} config
   * @throws {ListException}
   * @private
   */
  _processDependencies(config) {
    this._errors = [];

    Object.keys(config).forEach(hash => {
      const node = config[hash];
      const dependsOn = node.dependsOn.map(name => {
        const dependentComponent = Object.keys(config).find(it => config[it].name === name);
        const dependentConfig = config[dependentComponent];

        this.processRemoteStateTemplate(config, dependentConfig, hash);

        return ConfigLoader.buildComponentHash(dependentConfig.root);
      });

      node.dependsOn = Util.arrayToObject(dependsOn);
    });

    if (this._errors.length) {
      const messages = this._errors.map(error => `For component ${error.name} can not find ${error.variable} variable`);
      throw new ListException(messages, {
        header: 'Some components do not have defined variables:',
        style: ListException.NUMBER
      });
    }
  }

  /**
   * @param {String} hash
   * @param {Object} dependentConfig
   * @return {String | undefined}
   * @private
   */
  _retrieveRemoteStateNames(hash, dependentConfig) {
    const { name } = dependentConfig;
    const varsExists = new RegExp('\\${(.*?)}', 'gm');

    return this._terraformRemoteStates[hash].filter(it => it.component === name).map(it => {
      const vars = it.name.match(varsExists) || [];

      vars.forEach(variable => {
        const thubKeyWord = 'tfvars.terrahub';
        const path = variable.slice(2, -1);
        const property = getPropertyFromPath(dependentConfig.template, path.replace(thubKeyWord, 'local'))
          || getPropertyFromPath(dependentConfig.template, path.replace(thubKeyWord, 'tfvars'));
        if (!property) {
          this._errors.push({ name, variable });
        }

        it.name = it.name.replace(variable, property);
      });

      return it.name;
    });
  }

  /**
   * @param {String} hash
   * @param {String} name
   * @return {Boolean}
   * @private
   */
  _remoteStateExist(hash, name) {
    return this._terraformRemoteStates[hash] && this._terraformRemoteStates[hash].find(it => it.component === name);
  }

  /**
   * Defines terraform_remote_state from dependencies
   * @param {Object} config
   * @param {Object} dependentConfig
   * @param {String} hash
   */
  processRemoteStateTemplate(config, dependentConfig, hash) {
    const { project, template, name } = dependentConfig;

    if (!this._remoteStateExist(hash, name)) { return; }

    const configBackendExist = template.terraform && template.terraform.backend;
    const cachedBackendPath = Util.homePath(this.parameters.hclPath, `${name}_${project.code}`, 'terraform.tfstate');
    const cachedBackendExist = fs.existsSync(cachedBackendPath);

    if (!configBackendExist && !cachedBackendExist) { return; }

    const backend = configBackendExist ? template.terraform.backend : null;
    const backendType = backend ? Object.keys(backend)[0] : 'local';

    this._createTerraformRemoteStateObject(config, hash);

    const remoteStateName = this._retrieveRemoteStateNames(hash, dependentConfig) || name;
    const { workspace } = this._terraformRemoteStates[hash]
      .find(it => it.workspace && it.name === remoteStateName[0]) || { workspace: '' };

    const isHcl2 = semver.satisfies(config[hash].terraform.version, '>=0.12.0');
    const defaultRemoteConfig = {
      [remoteStateName]: {
        workspace: workspace || (isHcl2 ? 'terraform.workspace' : '${terraform.workspace}'),
        config: {
          ...(
            Object.prototype.hasOwnProperty.call(config[hash].terraform, 'backendConfig')
              ? config[hash].terraform.backendConfig
              : {}
          )
        }
      }
    };

    switch (backendType) {
      case 'local':
        if (backend) {
          Object.keys(backend.local).forEach(it => {
            let _path = backend.local[it];
            if (_path.includes('${tfvar.terrahub["component"]["name"]}')) {
              _path = _path.replace('${tfvar.terrahub["component"]["name"]}', name);
            }

            defaultRemoteConfig[remoteStateName].config[it] = (it === 'path' && !path.isAbsolute(_path))
              ? path.resolve(Util.homePath(this.parameters.hclPath, `${name}_${project.code}`), _path)
              : defaultRemoteConfig[remoteStateName].config[it] = _path;
          });
        } else {
          defaultRemoteConfig[remoteStateName].config['path'] = cachedBackendPath;
        }
        break;
      case 's3':
        Object.keys(backend.s3).forEach(it => {
          let _path = backend.s3[it];
          if (_path.includes('${tfvar.terrahub["component"]["name"]}')) {
            _path = _path.replace('${tfvar.terrahub["component"]["name"]}', name);
          }

          defaultRemoteConfig[remoteStateName].config[it] = _path;
        });
        break;
      case 'gcs':
        Object.keys(backend.gcs).forEach(it => { defaultRemoteConfig[remoteStateName].config[it] = backend.gcs[it]; });
        break;
      default:
        break;
    }

    defaultRemoteConfig[remoteStateName].backend = backendType;
    Object.assign(config[hash].template.data['terraform_remote_state'], defaultRemoteConfig);
  }

  /**
   * @param {Object} config
   * @param {String} hash
   * @private
   */
  _createTerraformRemoteStateObject(config, hash) {
    if (!config[hash].template.data) {
      config[hash].template.data = { 'terraform_remote_state': {} };
    } else if (!config[hash].template.data['terraform_remote_state']) {
      config[hash].template.data['terraform_remote_state'] = {};
    }
  }

  /**
   * Get filtered config
   * @returns {Object}
   */
  getFilteredConfig() {
    const fullConfig = this.getExtendedConfig();
    const config = { ...fullConfig };
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

    const filteredConfig = this.getDependencyStrategy().getExecutionList(fullConfig, filters);
    process.env.THUB_EXECUTION_LIST = Object.keys(filteredConfig).map(it => `${filteredConfig[it].name}:${it}`);

    if (!Object.keys(filteredConfig).length) {
      throw new Error(`No components available for the '${this.getName()}' action.`);
    }

    return filteredConfig;
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

    if (!diffList) {
      return [];
    }

    const config = super.getConfig();
    const result = {};

    Object.keys(config)
      .filter(hash => {
        const { mapping } = config[hash];

        return mapping && mapping.some(dep => diffList.some(diff => diff.startsWith(dep)));
      })
      .forEach(hash => { result[hash] = null; });

    // Add components' dependencies to the execution list
    // let newHashes = Object.keys(result);

    // while (newHashes.length) {
    //   const componentHash = newHashes.pop();
    //   const { dependsOn } = config[componentHash];

    //   if (dependsOn) {
    //     Object.keys(dependsOn)
    //       .filter(hash => !result.hasOwnProperty(hash))
    //       .forEach(hash => {
    //         newHashes.push(hash);
    //         result[hash] = null;
    //       });
    //   }
    // }

    return Object.keys(result);
  }

  /**
   * @return {String}
   */
  getDependencyOption() {
    return this.getOption('dependency');
  }

  /**
   * @returns {AbstractDependencyStrategy}
   */
  getDependencyStrategy() {
    if (!this._dependencyStrategy) {
      const option = this.getDependencyOption();

      switch (option) {
        case 'auto':
          this._dependencyStrategy = new DependenciesAuto();
          break;
        case 'ignore':
          this._dependencyStrategy = new DependenciesIgnore();
          break;
        case 'include':
          this._dependencyStrategy = new DependenciesInclude();
          break;
        default:
          throw new Error('Unknown Error!');
      }
    }

    return this._dependencyStrategy;
  }

  /**
   * @param {Object|Array} config
   * @param {Boolean} autoApprove
   * @param {String} customQuestion
   * @return {Promise}
   */
  askForApprovement(config, autoApprove = false, customQuestion = '') {
    LogHelper.printListAuto(config, this.getProjectConfig().name, this.terrahubCfg.listLimit);

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
    LogHelper.printListAuto(config, this.getProjectConfig().name, this.terrahubCfg.listLimit);

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

    this.getOption('var').map(item => Object.assign(result, Args.toObject(item)));

    return result;
  }

  /**
   * Check all components dependencies existence
   * @param {Object} config
   */
  _checkDependenciesExist(config) {
    const issues = {};

    Object.keys(config).forEach(hash => {
      const node = config[hash];

      issues[hash] = node.dependsOn.filter(name => {
        const dependentComponent = Object.keys(config).find(it => config[it].name === name);
        if (!dependentComponent) {
          return true;
        }

        const dependentConfig = config[dependentComponent];
        const key = ConfigLoader.buildComponentHash(dependentConfig.root);

        return !config.hasOwnProperty(key);
      });
    });

    const messages = Object.keys(issues).filter(it => issues[it].length).map(it => {
      return `'${config[it].name}' component depends on the component${issues[it].length > 1 ? 's' : ''} ` +
        `'${issues[it].join(`', '`)}' that either are not included or do not exist`;
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
   * @param {Object} config
   * @param {Number} direction
   * @protected
   * @throws {ListException}
   */
  checkDependencies(config, direction = Dictionary.DIRECTION.FORWARD) {
    if (this.getDependencyOption() === 'auto') {
      this._checkComponentsDependencies(config, direction);
    }

    this._checkDependencyCycle(config);
  }

  /**
   * Checks if all components' dependencies are included in config
   * @param {Object} config
   * @param {Number} direction
   * @private
   * @throws {ListException}
   */
  _checkComponentsDependencies(config, direction) {
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
    const checked = { ...config };
    const issues = {};

    Object.keys(fullConfig).forEach(it => { issues[it] = []; });

    while (hashesToCheck.length) {
      const hash = hashesToCheck.pop();
      const { dependsOn } = fullConfig[hash];

      Object.keys(dependsOn)
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
    const hashesToCheck = Object.keys(config);
    const checked = { ...config };
    const issues = {};

    Object.keys(fullConfig).forEach(it => { issues[it] = []; });

    while (hashesToCheck.length) {
      const hash = hashesToCheck.pop();

      Object.keys(fullConfig)
        .filter(it => {
          const { dependsOn } = fullConfig[it];

          return Object.keys(dependsOn).includes(hash);
        })
        .filter(it => !config.hasOwnProperty(it))
        .forEach(it => {
          issues[it].push(hash);

          if (!checked.hasOwnProperty(it)) {
            checked[it] = null;
            hashesToCheck.push(it);
          }
        });
    }

    return Object.keys(issues).filter(it => issues[it].length).map(hash => {
      const names = issues[hash].map(it => fullConfig[it].name);

      return `'${names.join(`', '`)}' component${names.length > 1 
        ? 's that are dependencies' : ' that is dependency'}`
        + ` of '${fullConfig[hash].name}' ${names.length > 1 ? 'are' : 'is'} excluded from the execution list`;
    });
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

module.exports = DistributedCommand;
