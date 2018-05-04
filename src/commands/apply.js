'use strict';

const AbstractCommand = require('../abstract-command');

class ApplyCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('apply')
      .setDescription('Run `terraform apply` across multiple terraform scripts')
      .addOption('test', 't', 'Test option')
    ;
  }

  run() {
    return Promise.resolve(this.getConfig());
  }
}

module.exports = ApplyCommand;
