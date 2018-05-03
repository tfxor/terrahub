'use strict';

const AbstractCommand = require('../abstract-command');

class ApplyCommand extends AbstractCommand {
  /**
   * @param {Object} input
   */
  constructor(input) {
    super(input);

    this._test = this.getOption('test');
  }

  /**
   * Command configuration
   */
  configure() {
    this
      .setName('apply')
      .setDescription('Run `terraform apply` across multiple terraform scripts')
      .addOption('test', 't', 'Test option', 'test-value')
    ;
  }

  run() {
    return Promise.resolve(this.getConfig());
  }
}

module.exports = ApplyCommand;
