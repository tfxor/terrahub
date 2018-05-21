'use strict';

const Distributor = require('../helpers/distributor');
const AbstractCommand = require('../abstract-command');

class ApplyCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('apply')
      .setDescription('Run `terraform apply` across multiple terraform scripts')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(['prepare', 'apply'], config);

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = ApplyCommand;
