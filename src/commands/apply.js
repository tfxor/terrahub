'use strict';

const Dictionary = require('../helpers/dictionary');
const TerraformCommand = require('../terraform-command');
const Distributor = require('../helpers/distributors/thread-distributor');

class ApplyCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('apply')
      .setDescription('run `terraform apply` across multiple terrahub components')
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getFilteredConfig();
    const distributor = new Distributor(config, this.runId);

    this.checkDependencies(config);

    return this.askForApprovement(config, this.getOption('auto-approve'))
      .then(answer => answer ?
        distributor.runActions(['prepare', 'workspaceSelect', 'plan'], {
          dependencyDirection: Dictionary.DIRECTION.FORWARD
        }) : Promise.reject('Action aborted')
      )

      .then(() => distributor.runActions(['apply'], { dependencyDirection: Dictionary.DIRECTION.FORWARD }))
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = ApplyCommand;
