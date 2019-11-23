'use strict';

const DistributedCommand = require('../distributed-command');

class PrepareCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('prepare')
      .setDescription('prepare cached HCL versions of terraform in $HOME/.terrahub/cache/hcl/');
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
