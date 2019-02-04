'use strict';

const Dictionary = require("../helpers/dictionary");
const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class DestroyCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('destroy')
      .setDescription('run `terraform destroy` across multiple terrahub components')
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigObject();
    const distributor = new Distributor(config);

    return this.checkDependencies(config, Dictionary.DIRECTION.REVERSE)
      .then(() => this.printExecutionList(config, !this.getOption('auto-approve')))
      .then(answer => answer ?
        distributor.runActions(['prepare', 'workspaceSelect', 'plan', 'destroy'], {
          silent: this.getOption('silent'),
          planDestroy: true,
          dependencyDirection: Dictionary.DIRECTION.REVERSE
        }) : Promise.reject('Action aborted')
      ).then(() => Promise.resolve('Done'));
  }
}

module.exports = DestroyCommand;
