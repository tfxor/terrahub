'use strict';

const TerraformCommand = require('../terraform-command');
const { sendWorkflowToApi } = require('../helpers/logger');
const Distributor = require('../helpers/distributors/thread-distributor');

class InitCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .enableElasticSearchLogging()
      .setName('init')
      .setDescription('run `terraform init` across multiple terrahub components')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getFilteredConfig();
    const distributor = new Distributor(config, this.runId);

    this.warnExecutionStarted(config);

    return sendWorkflowToApi({ status: 'create', target: 'workflow', runId: this.runId }).then(() =>
      distributor.runActions(['prepare', 'init']).then(() => Promise.resolve('Done')));
  }
}

module.exports = InitCommand;
