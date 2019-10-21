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
    const include = this.getOption('include');
    const config = this.getFilteredConfig();

    const distributor = new Distributor(config, this.runId);
    if (!batch || configContentArr.length > 0) {
      let linesMap = [];
      configContentArr.map(it => {
        const resourceData = it.split('=');
        linesMap.push({
          fullAddress: resourceData[0],
          value: resourceData[1],
          provider: providerContent
        });
      });
      return distributor.runActions(
        ['prepare', 'init', 'workspaceSelect', 'import'],
        { importLines: JSON.stringify(linesMap) })
        .then(() => 'Done');
    }

    const batchPath = resolve(config[Object.keys(config)[0]].project.root, batch);
    if (fse.existsSync(batchPath)) {
      return fse.readFile(batchPath)
        .then(content => {
          const lines = content.toString().split('\n')
          let linesMap = [];
          let autoIndex = { name: '', index: 0 };
          lines.forEach(line => {
            const elements = line.replace('\r', '').split(',');
            const elementsCount = (content.toString().match(new RegExp(elements[1], "g")) || []).length;
            if (autoIndex.name != elements[1]) {
              autoIndex.name = elements[1];
              autoIndex.index = 0;
            } else {
              autoIndex.index++;
            }
            if (include.includes(elements[0])) {
              linesMap.push({
                fullAddress: ((elementsCount > 1) ? `${autoIndex.name}[${autoIndex.index}]` : elements[1]),
                value: elements[2],
                provider: providerContent || (elements.length == 4 ? elements[3] : '')
              });
            }
          });
          return linesMap;
        })
        .then(lines => distributor.runActions(['prepare', 'init', 'workspaceSelect', 'import'], { importLines: JSON.stringify(lines) }))
        .then(() => 'Done');
    }
  }
}

module.exports = ImportCommand;
