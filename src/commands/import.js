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
      .addOption('config', 'c', 'Import resource', String)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const configContent = this.getOption('config');
    const configContentArr = configContent instanceof Array ? configContent : [configContent];
    const configAction = this.getConfigObject();

    const distributor = new Distributor(configAction);
    let finalArray = [];
    this.warnExecutionStarted(configAction);
    configContentArr.forEach(it => {
      const resourceData = it.split('=');
      finalArray.push(distributor
      .runActions(['prepare', 'init', 'workspaceSelect', 'import'], {
        silent: this.getOption('silent'),
        resourceName: resourceData[0],
        importId: resourceData[1]
      }));
    });


    return Promise.all(finalArray);
  }
}

module.exports = ImportCommand;
