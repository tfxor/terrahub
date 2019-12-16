'use strict';

const DistributedCommand = require('../distributed-command');

class StateCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('state')
      .setDescription('run distributedly `terraform state` across multiple terrahub components')
      .addOption('list', 'L', 'List resource(s) from terraform state', Boolean, false)
      .addOption('delete', 'D', 'Delete resource(s) from terraform state', Array, []);
  }

  /**
   * @returns {Promise}
   */
  async run() {
    const config = this.getFilteredConfig();
    this._list = this.getOption('list');
    this._delete = this.getOption('delete');

    if (this._delete.length > 0 && this._list) {
      return Promise.reject(new Error(`Terraform slug (type and name) is missing. ` +
        `Please specify a valid terraform resource.`));
    }

    if (this._delete.length === 0 && this._list) {
      return [{
        actions: ['init', 'workspaceSelect', 'resourceList'],
        config,
        stateList: this._list
      }];
    }

    return this._delete.map(it => ({
      actions: ['init', 'workspaceSelect', 'stateDelete'],
      config,
      stateDelete: it
    }));
  }
}

module.exports = StateCommand;
