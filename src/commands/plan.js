'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class PlanCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('plan')
      .setDescription('run `terraform plan` across multiple terrahub components')
      .setCategory('terraform execution')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(config, { env: this.buildEnv('prepare', 'plan') });

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = PlanCommand;
