'use strict';

const TerraformCommand = require('../terraform-command');
const Distributor = require('../helpers/distributors/thread-distributor');

class ImportCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('import')
      .setDescription('run `terraform import` across multiple terrahub components')
      .addOption('config', 'c', 'Import resource', Array)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const configContentArr = this.getOption('config');
    const configAction = this.getFilteredConfig();

    const distributor = new Distributor(configAction);
    return Promise.all(
      configContentArr.map(it => {
        const resourceData = it.split('=');

        return distributor
          .runActions(['prepare', 'init', 'workspaceSelect', 'import'], {
            resourceName: resourceData[0],
            importId: resourceData[1]
          });
      })
    );
  }
}

module.exports = ImportCommand;
