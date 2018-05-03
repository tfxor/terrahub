'use strict';

const path = require('path');
const treeify = require('treeify');
const MemberAccessor = require('../helpers/member-accessor');
const AbstractCommand = require('../abstract-command');

class GraphCommand extends AbstractCommand {
  /**
   * @param {Object} input
   */
  constructor(input) {
    super(input);

    this._accessor = new MemberAccessor({}, '/');
    this._directory = path.resolve(this.getOption('directory'));
  }

  /**
   * Command configuration
   */
  configure() {
    this
      .setName('graph')
      .setDescription('Build terraform modules tree')
      .addOption('directory', 'd', 'Path to start building a graph (default: cwd)', process.cwd())
    ;
  }

  /**
   * Build modules graph
   * @returns {Promise}
   */
  run() {
    this.listConfigs(this._directory).forEach(configPath => {
      this._accessor.set(configPath, null);
    });

    console.log(treeify.asTree(this._accessor.getRaw(), false));

    return Promise.resolve();
  }
}

module.exports = GraphCommand;
