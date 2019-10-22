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
      .addOption('overwrite', 'O', 'Overwrite existing elements in tfstate', Boolean, false)
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
    const exclude = this.getOption('exclude');
    const overwrite = this.getOption('overwrite');
    const includeRegex = this.getOption('include-regex');
    const excludeRegex = this.getOption('exclude-regex');

    const config = this.getFilteredConfig();
    const distributor = new Distributor(config, this.runId);
    if (!batch || configContentArr.length > 0) {
      let linesMap = [];
      configContentArr.map(it => {
        const resourceData = it.split('=');
        linesMap.push({
          component: '',
          fullAddress: resourceData[0],
          value: resourceData[1],
          provider: providerContent,
          overwrite: overwrite,
          hash: config[Object.keys(config)[0]].project.code
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
            const filters = [
              includeRegex.length ? includeRegex.some(regex => regex.test(elements[0])) : null,
              include.length ? include.includes(elements[0]) : null,
              excludeRegex.length ? !excludeRegex.some(regex => regex.test(elements[0])) : null,
              exclude.length ? !exclude.includes(elements[0]) : null
            ].filter(Boolean);
            if (filters[0]) {
              linesMap.push({
                component: elements[0],
                fullAddress: ((elementsCount > 1) ? `${autoIndex.name}[${autoIndex.index}]` : elements[1]),
                value: elements[2],
                provider: providerContent || (elements.length == 4 ? elements[3] : ''),
                overwrite: overwrite,
                hash: config[Object.keys(config)[0]].project.code
              });
            }
          });
          return distributor.runActions(['prepare', 'init', 'workspaceSelect', 'import'], { importLines: JSON.stringify(linesMap) });
        })
        .then(() => 'Done');
    }
  }
}

module.exports = ImportCommand;
