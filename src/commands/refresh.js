'use strict';

const TerraformCommand = require('../terraform-command');
const Distributor = require('../helpers/distributors/thread-distributor');

class RefreshCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('refresh')
      .setDescription('run `terraform refresh` across multiple terrahub components')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigObject();
    const distributor = new Distributor(config);

    this.warnExecutionStarted(config);

    return distributor.runActions(['prepare', 'workspaceSelect', 'refresh'], {
      silent: this.getOption('silent')
    }).then(() => Promise.resolve('Done'));
  }
}

module.exports = RefreshCommand;
