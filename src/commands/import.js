'use strict';

const fse = require('fs-extra');
const { resolve } = require('path');
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
      .addOption('config', 'c', 'Import resource', Array, [])
      .addOption('provider', 'j', 'Import provider', String, '')
      .addOption('batch', 'b', 'Import batch', String, '')
      ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const configContentArr = this.getOption('config');
    const providerContent = this.getOption('provider');
    const batch = this.getOption('batch');
    const config = this.getFilteredConfig();

    const distributor = new Distributor(config, this.runId);

    if (!batch && configContentArr) {
      return Promise.all(
        configContentArr.map(it => {
          const resourceData = it.split('=');

          return distributor
            .runActions(['prepare', 'init', 'workspaceSelect', 'import'], {
              resourceName: resourceData[0],
              importId: resourceData[1],
              providerId: providerContent
            });
        })
      ).then(() => 'Done');
    }

    const batchPath = resolve(config[Object.keys(config)[0]].project.root, batch);
    if (fse.existsSync(batchPath)) {
      return fse.readFile(batchPath).then(content => {
        const lines = content.toString().split('\n');
        const promises = lines.map(line => {
          console.log(line);
          const elements = line.replace('\r','').split(',');
          const providerAlias = providerContent || (elements.length == 4 ? elements[3] : '');
          return distributor
            .runActions(['prepare', 'init', 'workspaceSelect', 'import'], {
              resourceName: elements[1],
              importId: elements[2],
              providerId: providerAlias
            });
        });
        return Promise.all(promises).then(() => 'Done');
      });
    }
  }
}

module.exports = ImportCommand;
