'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const logger = require('../helpers/logger');

class PrepareCommand extends TerraformCommand {
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
    const config = this.getConfigObject();
    const distributor = new Distributor(config);
    if (!this.getOption('silent')) {
      const firstKey = Object.keys(config)[0];
      logger.raw(firstKey);
    }
    return distributor
      .runActions(['prepare'], {
        silent: this.getOption('silent')
      }).then(() => Promise.resolve('Done'));
  }
}

module.exports = PrepareCommand;
