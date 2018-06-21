'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class InitCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'init';
  }

  static get description() {
    return 'Run `terraform init` across multiple terraform scripts';
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(['prepare', 'init'], config);

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = InitCommand;
