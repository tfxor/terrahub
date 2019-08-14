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
  async run() {
    const config = this.getFilteredConfig();

    this.checkDependencies(config);

    const dependencyDirection = Dictionary.DIRECTION.FORWARD;
    const firstStep = { actions: ['prepare', 'workspaceSelect', 'plan'], dependencyDirection };
    const secondStep = { actions: ['apply'], dependencyDirection };

    const answer = await this.askForApprovement(config, this.getOption('auto-approve'));
    return answer ? Promise.all([firstStep, secondStep]) : Promise.reject('Action aborted');
  }
}

module.exports = ApplyCommand;
