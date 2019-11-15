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
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  async run() {
    const config = this.getFilteredConfig();

    this.checkDependencies(config);

    const isApproved = await this.askForApprovement(config, this.getOption('auto-approve'));

    if (!isApproved) {
      throw new Error('Action aborted');
    }

    return [{
      actions: ['prepare', 'workspaceSelect', 'plan', 'apply'],
      config,
      dependencyDirection: Dictionary.DIRECTION.FORWARD
    }];
  }
}

module.exports = ApplyCommand;
