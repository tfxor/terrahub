'use strict';

const DistributedCommand = require('../distributed-command');

class ImportCommand extends DistributedCommand {
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

    const distributor = this.getDistributor(configAction);
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
