'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { yesNoQuestion } = require('../helpers/util');

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
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigTree();
    const actions = ['apply', 'destroy'].filter(action => this.getOption(action));
    const distributor = new Distributor(config, {
      env: this.buildEnv(['prepare', 'init', 'workspaceSelect', 'plan', ...actions])
    });

    return this._getPromise()
      .then(answer => {
        if (answer) {
          return distributor.run();
        } else {
          return Promise.reject('Action aborted');
        }
      })
      .then(() => Promise.resolve('Done'));
  }

  /**
   * @return {Promise}
   * @private
   */
  _getPromise() {
    if (this.getOption('auto-approve')) {
      return Promise.resolve(true);
    } else {
      return yesNoQuestion('Do you want to perform `run` action? (Y/N) ');
    }
  }
}

module.exports = RunCommand;
