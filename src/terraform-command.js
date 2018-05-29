'use strict';

const { toBase64 } = require('./helpers/util');
const AbstractCommand = require('./abstract-command');

class TerraformCommand extends AbstractCommand {
  /**
   * Command initialization
   * (post configure action)
   */
  initialize() {
    this.addOption('include', 'i', 'Components to work with', Array, '');
  }

  /**
   * @returns {Promise}
   */
  validate() {
    return super.validate().then(() => {
      if (!this._isProjectReady()) {
        this.logger.info('Configuration file not found, please go to project root folder, or initialize it');
      } else if (this._areComponentsReady()) {
        this.logger.info('No configured components found, please create from template or configure existing');
      }
    });
  }

  /**
   * Get filtered config
   * @returns {Object}
   */
  getConfig() {
    const config = super.getConfig();
    const include = this.getOption('include');

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
   * Get config tree
   * @returns {Object}
   */
  getConfigTree() {
    let tree = {};
    let config = Object.assign({}, this.getConfig());

    Object.keys(config).forEach(hash => {
      let node = config[hash];

      if (node.parent === null) {
        tree[hash] = node;
      } else {
        config[toBase64(node.parent)].children.push(node);
      }
    });

    return tree;
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
