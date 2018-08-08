'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class ApplyCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('apply')
      .setDescription('run `terraform apply` across multiple terrahub components')
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, true)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(config, { env: this.buildEnv(['prepare', 'apply']) });

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = ApplyCommand;
