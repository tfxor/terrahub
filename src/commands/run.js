'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class RunCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('run')
      .setDescription('execute automated workflow terraform init > workspace > plan > apply > destroy')
      .addOption('apply', 'a', 'Enable apply command as part of automated workflow', Boolean, false)
      .addOption('destroy', 'd', 'Enable destroy command as part of automated workflow', Boolean, false)
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, true)
      .setCategory('cloud automation')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const actions = ['apply', 'destroy'].filter(action => this.getOption(action));
    const distributor = new Distributor(config, {
      env: this.buildEnv('prepare', 'init', 'workspaceSelect', 'plan', ...actions)
    });

    return distributor
      .run()
      .then(() => Promise.resolve('Done'));
  }
}

module.exports = RunCommand;
