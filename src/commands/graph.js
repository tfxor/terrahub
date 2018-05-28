'use strict';

const path = require('path');
const treeify = require('treeify');
const MemberAccessor = require('../helpers/member-accessor');
const AbstractCommand = require('../abstract-command');

class GraphCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('graph')
      .setDescription('Build terraform modules tree')
      .addOption('directory', 'd', 'Path to start building a graph (default: cwd)', String, process.cwd())
    ;
  }

  /**
   * Build modules graph
   * @returns {Promise}
   */
  run() {
    const accessor = new MemberAccessor({}, '/');
    const directory = path.resolve(this.getOption('directory'));

    this.listConfigs(directory).forEach(configPath => {
      accessor.set(configPath, null);
    });

    this.logger.raw(treeify.asTree(accessor.getRaw(), false));

    return Promise.resolve();
  }

  /**
   * Get only children of some path
   * @param {Array} paths
   * @param {String} root
   * @returns {Array}
   * @private
   */
  _childrenOf(paths, root) {
    return paths.filter(path => root.indexOf(path) === 0);
  }
}

module.exports = GraphCommand;
