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
      .addOption('config', 'c', 'Import resource', Array)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const configContentArr = this.getOption('config');
    const configAction = this.getConfigObject();

    const distributor = new Distributor(configAction);
    return Promise.all(
      configContentArr.map(it => {
        const resourceData = it.split('=');
        
        return distributor
          .runActions(['prepare', 'init', 'workspaceSelect', 'import'], {
            silent: this.getOption('silent'),
            resourceName: resourceData[0],
            importId: resourceData[1]
          });
      })
    )
  }
}

module.exports = ImportCommand;
