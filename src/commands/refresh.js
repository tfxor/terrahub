'use strict';

const { config } = require('../parameters');
const TerraformCommand = require('../terraform-command');

class RefreshCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('refresh')
      .setDescription('run `terraform refresh` across multiple terrahub components [Not Implemented Yet]')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    console.log('object', this.getOption('object'));
    console.log('array', this.getOption('array'));
    console.log('force', this.getOption('force'));

    console.log('var', this.getVar());
    console.log('var-file', this.getVarFile());
    console.log('config.env', config.env);
    console.log('getProjectConfig', this.getProjectConfig());

    console.log(JSON.stringify(this.getConfig(), null, 2));

    return Promise.resolve('Done');
  }
}

module.exports = RefreshCommand;
