'use strict';

const DistributedCommand = require('../distributed-command');
const Distributor = require('../helpers/distributors/thread-distributor');

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
  async run() {
    const config = this.getFilteredConfig();

    this.warnExecutionStarted(config);

    return [{ actions: ['prepare', 'init'] }];
  }
}

module.exports = InitCommand;
