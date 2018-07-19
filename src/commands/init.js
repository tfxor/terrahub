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
      .setDescription('run `terraform init` across multiple terraform scripts')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const distributor = new Distributor(config, 'terraform-worker.js', this.buildEnv('prepare', 'init'));

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = InitCommand;
