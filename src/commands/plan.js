'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class PlanCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'plan';
  }

  static get description() {
    return 'run `terraform plan` across multiple terraform scripts';
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
