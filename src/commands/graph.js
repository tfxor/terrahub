'use strict';

const treeify = require('treeify');
const { familyTree } = require('../helpers/util');
const AbstractCommand = require('../abstract-command');

class GraphCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'graph';
  }

  static get description() {
    return 'show the graph of dependencies between terrahub components';
  }

  /**
   * Build modules graph
   * @returns {Promise}
   */
  run() {
    const { name } = this.getProjectConfig();
    const treeConfig = familyTree(this.getConfig());
    const configList = Object.keys(treeConfig).map(hash => treeConfig[hash]);
    const tree = this._format(configList);

    if (name) {
      this.logger.log(name);

      treeify.asLines(tree, false, line => {
        this.logger.log(` ${line}`);
      });

      this.logger.warn('Paths are relative to the project root');
    }

    return Promise.resolve('Done');
  }

  /**
   * @param {Array} configs
   * @returns {Object}
   * @private
   */
  _format(configs) {
    const result = {};

    configs.forEach(item => {
      const key = `${item.name} [${item.root}]`;

      result[key] = item.children.length === 0 ? null : this._format(item.children);
    });

    return result;
  }
}

module.exports = GraphCommand;
