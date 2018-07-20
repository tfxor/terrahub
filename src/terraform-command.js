'use strict';

const Args = require('../src/helpers/args-parser');
const AbstractCommand = require('./abstract-command');
const { familyTree, extend, uuid } = require('./helpers/util');

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

      if (!this._isProjectReady()) {
        errorMessage = 'Configuration file not found. '
          + 'Either re-run the same command in project\'s root or initialize new project with `terrahub project`';
      } else if (this._areComponentsReady()) {
        errorMessage = 'Components are not defined. '
          + 'Please create new component with `terrahub create` or include existing one with `terrahub component`';
      }

      return (errorMessage) ? Promise.reject(new Error(errorMessage)) : Promise.resolve();
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
    }
  }

  /**
   * @returns {Boolean}
   * @private
   */
  _isProjectReady() {
    return this._configLoader.isProjectConfigured();
  }

  /**
   * @returns {Boolean}
   * @private
   */
  _areComponentsReady() {
    return (this._configLoader.componentsCount() === 0);
  }
}

module.exports = TerraformCommand;
