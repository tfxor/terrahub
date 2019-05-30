'use strict';

const DistributedCommand = require('../distributed-command');

class PrepareCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('prepare')
      .setDescription('run `terraform prepare` across multiple terrahub components')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getFilteredConfig();
    const distributor = this.getDistributor(config);

    return distributor.runActions(['prepare']).then(() => Promise.resolve('Done'));
  }
}

module.exports = PrepareCommand;
