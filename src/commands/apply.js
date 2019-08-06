'use strict';

const Dictionary = require('../helpers/dictionary');
const DistributedCommand = require('../distributed-command');

class ApplyCommand extends DistributedCommand {
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
    debugger;
    const config = this.getFilteredConfig();
    // const distributor = new Distributor(config, this.runId);

    this.checkDependencies(config);
    const actions = ['prepare', 'workspaceSelect', 'plan', 'apply'];
    const dependencyDirections = Dictionary.DIRECTION.FORWARD;

    return this.askForApprovement(config, this.getOption('auto-approve'))
      .then(answer => answer ?
        Promise.resolve([config, actions, dependencyDirections]) : Promise.reject('Action aborted')
      );
  }
}

module.exports = ApplyCommand;
