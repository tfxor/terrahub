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
  async run() {
    const config = this.getFilteredConfig();

    return [{ actions: ['prepare'], config }];
  }
}

module.exports = PrepareCommand;
