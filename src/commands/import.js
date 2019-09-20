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
      .addOption('provider', 'j', 'Import provider', String, '')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const configContentArr = this.getOption('config');
    const providerContent = this.getOption('provider');
    const config = this.getFilteredConfig();

    const distributor = new Distributor(config, this.runId);
    return Promise.all(
      configContentArr.map(it => {
        const resourceData = it.split('=');

        return distributor
          .runActions(['prepare', 'init', 'workspaceSelect', 'import'], {
            resourceName: resourceData[0],
            importId: resourceData[1],
            providerId: providerContent
          }).then(() => 'Done');
      })
    );
  }
}

module.exports = ImportCommand;
