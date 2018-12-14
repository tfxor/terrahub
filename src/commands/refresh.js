'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

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
    return this.getEnvVarsFromAPI().then(data => this.getExtendedProcessEnv(data)).then(() => {
      return distributor.runActions(['prepare', 'workspaceSelect', 'refresh'], {
        silent: this.getOption('silent')
      }).then(() => Promise.resolve('Done'));
    });
  }
}

module.exports = RefreshCommand;
