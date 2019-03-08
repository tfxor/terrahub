'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class ImportCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('import')
      .setDescription('run `terraform import` for single terrahub component')
      .addOption('resource', 't', 'Runs the command with resource full name', String)
      .addOption('id', 'k', 'Runs the command with resource id', String)
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
      .runActions(['prepare', 'workspaceSelect', 'init', 'import'], {
        silent: this.getOption('silent'),
        resourceName: this.getOption('resource'),
        importId: this.getOption('id')
      }).then(() => Promise.resolve('Done'));
  }
}

module.exports = ImportCommand;
