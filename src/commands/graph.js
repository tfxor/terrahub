'use strict';

const treeify = require('treeify');
const AbstractCommand = require('../abstract-command');
const { linkChildren } = require('../helpers/util');

class GraphCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('graph')
      .setDescription('Show the graph of dependencies between terrahub components')
    ;
  }

  /**
   * Build modules graph
   * @returns {Promise}
   */
  run() {
    const { name } = this.getProjectConfig();
    const treeConfig = linkChildren(this.getConfig());
    const configList = Object.keys(treeConfig).map(hash => treeConfig[hash]);
    const tree = this._format(configList);

    if (name) {
      this.logger.raw(name);

      treeify.asLines(tree, false, line => {
        this.logger.raw(` ${line}`);
      });

      this.logger.info('Paths are relative to the project root');
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
