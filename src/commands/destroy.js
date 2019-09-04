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
    if (!isApproved) {
      throw new Error('Action aborted');
    }

    return [{
      actions: ['prepare', 'init', 'workspaceSelect', 'plan', 'destroy'],
      config,
      planDestroy: true,
      dependencyDirection: Dictionary.DIRECTION.REVERSE
    }];
  }
}

module.exports = DestroyCommand;
