'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class DestroyCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'destroy';
  }

  static get description() {
    return 'run `terraform destroy` across multiple terraform scripts';
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(['prepare', 'destroy'], config);

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = DestroyCommand;
