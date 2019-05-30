'use strict';

const DistributedCommand = require('../distributed-command');

class RefreshCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('refresh')
      .setDescription('run `terraform refresh` across multiple terrahub components')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getFilteredConfig();
    const distributor = this.getDistributor(config);

    this.warnExecutionStarted(config);

    return distributor.runActions(['prepare', 'workspaceSelect', 'refresh']).then(() => Promise.resolve('Done'));
  }
}

module.exports = RefreshCommand;
