'use strict';

const TerraformCommand = require('../terraform-command');

class ShowCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('show')
  //     .setDescription('run `terraform show` across multiple terraform scripts')
    ;
  }
}

module.exports = ShowCommand;
