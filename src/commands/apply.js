'use strict';

const Dictionary = require('../helpers/dictionary');
const DistributorCommand = require('../distributed-command');

class ApplyCommand extends DistributorCommand {
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
    const distributor = this.getDistributor();

    this.checkDependencies(config);

    return this.askForApprovement(config, this.getOption('auto-approve'))
      .then(answer => answer ?
        distributor.runActions(['prepare', 'workspaceSelect', 'plan', 'apply'], {
          dependencyDirection: Dictionary.DIRECTION.FORWARD
        }) : Promise.reject('Action aborted')
      ).then(() => Promise.resolve('Done'));
  }
}

module.exports = ApplyCommand;
