'use strict';

const DistributedCommand = require('../distributed-command');

class RefreshCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('refresh')
      .setDescription('run distributedly `terraform refresh` across multiple terrahub components');
  }

  /**
   * @returns {Promise}
   */
  async run() {
    const config = this.getFilteredConfig();

    this.warnExecutionStarted(config);

    return [{
      actions: ['workspaceSelect', 'refresh'],
      config,
    }];
  }
}

module.exports = RefreshCommand;
