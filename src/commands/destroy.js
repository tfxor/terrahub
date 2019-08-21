'use strict';

const Dictionary = require('../helpers/dictionary');
const DistributedCommand = require('../distributed-command');

class DestroyCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('destroy')
      .setDescription('run `terraform destroy` across multiple terrahub components')
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  async run() {
    const config = this.getFilteredConfig();

    this.checkDependencies(config, Dictionary.DIRECTION.REVERSE);

    const isApproved = await this.askForApprovement(config, this.getOption('auto-approve'));
    const dependencyDirection = Dictionary.DIRECTION.REVERSE;

    const firstStep = {
      actions: ['prepare', 'init', 'workspaceSelect', 'plan'], config, planDestroy: true, dependencyDirection
    };
    const secondStep = {
      actions: ['destroy'], config, planDestroy: true, dependencyDirection
    };

    if (isApproved) {
      return Promise.all([firstStep, secondStep]);
    } else {
      throw new Error('Action aborted');
    }
  }
}

module.exports = DestroyCommand;
