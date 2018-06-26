'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const ReadLine = require('readline');
const { config } = require('../parameters');
const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class WorkspaceCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('workspace')
      .setDescription('Run `terraform workspace` across multiple terraform scripts')
      .addOption('env', 'e', 'Workspace to create', String, '')
      .addOption('delete', 'd', 'Flag to delete --env configs', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const env = this.getOption('env');
    const kill = this.getOption('delete');
    const configs = this.listConfigs();

    if (!env) {
      const config = this.getConfigTree();
      const distributor = new Distributor(['prepare', 'workspace'], config);

      return distributor
        .run()
        .then(() => Promise.resolve('Done'));
    }

    let promises = [];
    configs.forEach(configPath => {
      const dir = path.dirname(configPath);
      const envConfig = path.join(dir, `.terrahub.${env}.${config.format}`);

      if (!fs.existsSync(envConfig) && !kill) {
        promises.push(fse.copy(configPath, envConfig));
      }

      if (fs.existsSync(envConfig) && kill) {
        promises.push(fse.unlink(envConfig));
      }
    });

    if (!kill) {
      return Promise
        .all(promises)
        .then(() => Promise.resolve(`${env} environment created`));
    }

    const rl = ReadLine.createInterface({
      input: process.stdin,
      output: process.stdout,
      historySize: 0
    });

    return new Promise(resolve => {
      rl.question('Are you sure (Y/N)? ', answer => {
        if (!['y', 'yes'].includes(answer.toLowerCase())) {
          return resolve('Canceled');
        }

        Promise.all(promises).then(() => resolve(`${env} environment deleted`));
      });
    });
  }
}

module.exports = WorkspaceCommand;
