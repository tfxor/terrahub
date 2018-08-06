'use strict';

const Args = require('../src/helpers/args-parser');
const AbstractCommand = require('./abstract-command');
const { familyTree, extend, uuid, askQuestion, toMd5 } = require('./helpers/util');

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
    return super.validate().then(() => {
      let errorMessage = '';

      const projectConfig = this._configLoader.getProjectConfig();

      const missingProjectData = this._getProjectDataMissing(projectConfig);
      let nonExistingComponents;

      if (missingProjectData === 'config') {
        errorMessage = 'Configuration file not found. '
          + 'Either re-run the same command in project\'s root or initialize new project with `terrahub project`.';
      } else if (missingProjectData) {
        return askQuestion(`Global config is missing project ${missingProjectData}. `
          + `Please provide value (e.g. ${missingProjectData === 'code' ?
            this._code(projectConfig.name, projectConfig.provider) : 'terrahub-demo'}): `
        ).then(answer => {

          try {
            this._configLoader.addToGlobalConfig(missingProjectData, answer);
          } catch (error) {
            this.logger.debug(error);
          }

          this._configLoader.updateRootConfig();

          return this.validate();
        });

      } else if (this._areComponentsReady()) {
        errorMessage = 'No components defined in configuration file. '
          + 'Please create new component or include existing one with `terrahub component`';
      } else if ((nonExistingComponents = this._getNonExistingComponents()).length) {
        errorMessage = 'Some of components were not found: ' + nonExistingComponents.join(', ');
      }

      return errorMessage ? Promise.reject(new Error(errorMessage)) : Promise.resolve(this);
    });
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
      result[hash] = extend(config[hash], [cliParams]);
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
   * Get config tree
   * @returns {Object}
   */
  getConfigTree() {
    return familyTree(this.getConfig());
  }

  /**
   * @param {String} actions
   * @return {Object}
   */
  buildEnv(...actions) {
    return {
      TERRAFORM_ACTIONS: actions,
      THUB_RUN_ID: uuid()
    };
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
  _areComponentsReady() {
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
