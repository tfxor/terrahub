'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class InitCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('init')
      .setDescription('run `terraform init` across multiple terrahub components')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const config = this.getConfigObject();
    const distributor = new Distributor(config);

    this.warnExecutionStarted(config);

    return distributor
      .runActions(['prepare', 'init'], {
        silent: this.getOption('silent')
      }).then(() => Promise.resolve('Done'));
  }
}

module.exports = InitCommand;
