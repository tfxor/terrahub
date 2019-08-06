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
  async run() {
    const configContentArr = this.getOption('config');
    const config = this.getFilteredConfig();

    return Promise.all(
      configContentArr.map(it => {
        const resourceData = it.split('=');

        return [{
          actions: ['prepare', 'init', 'workspaceSelect', 'import'],
          config,
          resourceName: resourceData[0],
          importId: resourceData[1]
        }];
      })
    );
  }
}

module.exports = ImportCommand;
