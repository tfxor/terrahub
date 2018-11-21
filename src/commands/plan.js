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
      .addOption('destroy', 'd', 'Runs the command with destroy plan', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigObject();
    const distributor = new Distributor(config);

    return distributor
      .runActions(['prepare', 'workspaceSelect', 'plan'], {
        silent: this.getOption('silent'),
        planDestroy: this.getOption('destroy')
      }).then(() => Promise.resolve('Done'));
  }
}

module.exports = PlanCommand;
