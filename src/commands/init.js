'use strict';

const DistributedCommand = require('../distributed-command');

class InitCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('init')
      .setDescription('run distributedly `terraform init` across multiple terrahub components');
  }

  /**
   * @returns {Promise}
   */
  async run() {
    const config = this.getFilteredConfig();

    this.warnExecutionStarted(config);

    return [{ actions: ['prepare', 'init'], config }];
  }
}

module.exports = InitCommand;
