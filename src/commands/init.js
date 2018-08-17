'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class InitCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('init')
      .setDescription('run `terraform init` across multiple terrahub components')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const order = this.getTarjanOrder();
    const distributor = new Distributor(order, ['prepare', 'init']);

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = InitCommand;
