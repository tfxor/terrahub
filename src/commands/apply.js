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
      .setDescription('run distributedly `terraform apply` across multiple terrahub components')
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false)
      .addOption('refresh-only', 'R', 'Use Refresh-Only Mode to Sync Terraform State', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  async run() {
    const config = this.getFilteredConfig();
    this._refreshOnly = this.getOption('refresh-only');

    this.checkDependencies(config);

    const isApproved = await this.askForApprovement(config, this.getOption('auto-approve'));

    if (!isApproved) {
      throw new Error('Action aborted');
    }

    if (this._refreshOnly) {
      return [{
        actions: ['workspaceSelect', 'plan', 'applyRefreshOnly'],
        config,
        dependencyDirection: Dictionary.DIRECTION.FORWARD
      }];
    }

    return [{
      actions: ['workspaceSelect', 'plan', 'apply'],
      config,
      dependencyDirection: Dictionary.DIRECTION.FORWARD
    }];
  }
}

module.exports = ApplyCommand;
