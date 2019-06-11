'use strict';

const Dictionary = require('../helpers/dictionary');
const TerraformCommand = require('../terraform-command');
const Distributor = require('../helpers/distributors/thread-distributor');
const { sendWorkflowToApi } = require('../helpers/logger');

class DestroyCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .enableElasticSearchLogging()
      .setName('destroy')
      .setDescription('run `terraform destroy` across multiple terrahub components')
      .addOption('auto-approve', 'y', 'Auto approve terraform execution', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getFilteredConfig();
    const distributor = new Distributor(config, this.runId);

    this.checkDependencies(config, Dictionary.DIRECTION.REVERSE);


    return this.askForApprovement(config, this.getOption('auto-approve'))
      .then(answer => answer ? sendWorkflowToApi({ status: 'create', target: 'workflow', runId: this._runId }).then(() =>
        distributor.runActions(['prepare', 'init', 'workspaceSelect', 'plan', 'destroy'], {
          planDestroy: true,
          dependencyDirection: Dictionary.DIRECTION.REVERSE
        })) : Promise.reject('Action aborted')
      ).then(() => Promise.resolve('Done'));
  }
}

module.exports = DestroyCommand;
