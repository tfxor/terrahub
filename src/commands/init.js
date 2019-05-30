'use strict';

const DistributedCommand = require('../distributed-command');

class InitCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('init')
      .setDescription('run `terraform init` across multiple terrahub components')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getFilteredConfig();
    const distributor = this.getDistributor(config);

    this.warnExecutionStarted(config);

    return distributor
      .runActions(['prepare', 'init']).then(() => Promise.resolve('Done'));
  }
}

module.exports = InitCommand;
