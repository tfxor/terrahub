'use strict';

const DistributedCommand = require('../distributed-command');

class PlanCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('plan')
      .setDescription('run distributedly `terraform plan` across multiple terrahub components')
      .addOption('destroy', 'd', 'Runs the command with destroy plan', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  async run() {
    const config = this.getFilteredConfig();

    this.warnExecutionStarted(config);

    return [{
      actions: ['workspaceSelect', 'plan'],
      config,
      planDestroy: this.getOption('destroy')
    }];
  }
}

module.exports = PlanCommand;
