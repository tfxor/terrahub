'use strict';

const Distributor = require('../helpers/distributor');
const AbstractCommand = require('../abstract-command');

class PlanCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('plan')
      .setDescription('Run `terraform plan` across multiple terraform scripts')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(['prepare', 'plan'], config);

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = PlanCommand;
