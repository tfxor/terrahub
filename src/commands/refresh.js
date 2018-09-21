'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class RefreshCommand extends TerraformCommand {
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
    const config = this.getConfigObject();
    const distributor = new Distributor(config, { silent: this.getOption('silent') });

    return distributor.runActions(['prepare', 'refresh']);
  }
}

module.exports = RefreshCommand;
