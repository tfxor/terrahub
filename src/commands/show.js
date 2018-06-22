'use strict';

const TerraformCommand = require('../terraform-command');

class ShowCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'show';
  }

  static get description() {
    return 'run `terraform show` across multiple terraform scripts';
  }
}

module.exports = ShowCommand;
