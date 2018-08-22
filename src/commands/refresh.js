'use strict';

const TerraformCommand = require('../terraform-command');

class RefreshCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('refresh')
      .setDescription('run `terraform refresh` across multiple terrahub components [Not Implemented Yet]')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    return Promise.resolve('Done');
  }
}

module.exports = RefreshCommand;
