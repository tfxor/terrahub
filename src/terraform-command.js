'use strict';

const Args = require('../src/helpers/args-parser');
const AbstractCommand = require('./abstract-command');
const { familyTree, extend } = require('./helpers/util');

class TerraformCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  static get options() {
    let list = super.options;

    list
      .addOption('include', 'i', 'Components to work with', Array, [])
      .addOption('var', 'r', 'Set of variables', Array, [])
      .addOption('var-file', 'l', 'Set of variables defined in files', Array, []);

    return list;
  }

  /**
   * @returns {Promise}
   */
  validate() {
    return super.validate().then(() => {
      if (!this._isProjectReady()) {
        this.logger.warn('Configuration file not found, please go to project root folder, or initialize it');
      } else if (this._areComponentsReady()) {
        this.logger.warn('No configured components found, please create from template or configure existing');
      }
    });
  }

  /**
   * Get extended via CLI configs
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
