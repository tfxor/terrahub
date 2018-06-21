'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class ApplyCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'apply';
  }

  static get description() {
    return 'Run `terraform apply` across multiple terraform scripts';
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
