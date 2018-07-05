'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const HashTable = require('../helpers/hash-table');
const Distributor = require('../helpers/distributor');
const ConfigLoader = require('../config-loader');
const TerraformCommand = require('../terraform-command');
const { config, templates } = require('../parameters');
const { renderTwig, yesNoQuestion } = require('../helpers/util');

class WorkspaceCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('workspace')
      .setDescription('run `terraform workspace` across multiple terraform scripts')
      .addOption('delete', 'd', 'Delete workspace environment (paired with --env)', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    let files = [];
    let promises = [];
    let tree = this.getConfigTree();
    let kill = this.getOption('delete');
    let { name, code } = this.getProjectConfig();

    if (config.isDefault) {
      return this._workspace('workspaceSelect', tree).then(() => 'Done');
    }

    this.listConfigs().forEach(configPath => {
      const dir = path.dirname(configPath);
      const envConfig = path.join(dir, config.fileName);
      const tfvarsName = `workspace/${config.env}.tfvars`;
      const tfvarsPath = path.join(dir, tfvarsName);

      if (!fs.existsSync(envConfig) && !kill) {
        const creating = new HashTable({});
        const existing = new HashTable(ConfigLoader.readConfig(configPath));
        const template = path.join(templates.workspace, 'default.tfvars.twig');

        existing.transform('varFile', (key, value) => {
          value.push(tfvarsName);
          creating.set(key, value);
        });

        ConfigLoader.writeConfig(creating.getRaw(), envConfig);

        promises.push(renderTwig(template, { name, code, env: config.env }, tfvarsPath));
      }

      if (fs.existsSync(envConfig) && kill) {
        files.push(envConfig, tfvarsPath);
      }
    });

    if (!kill) {
      return Promise
        .all(promises)
        // @todo discuss this behaviour (it's useless for first run)
        .then(() => this._workspace('workspaceSelect', tree))
        .then(() => Promise.resolve(`${config.env} environment created`));
    }

    return yesNoQuestion('Are you sure (Y/N)? ').then(confirmed => {
      if (!confirmed) {
        return Promise.resolve('Canceled');
      }

      return Promise
        .all(files.map(file => fse.unlink(file)))
        .then(() => this._workspace('workspaceDelete', tree))
        .then(() => Promise.resolve(`${config.env} environment deleted`));
    });
  }

  /**
   * @param {String} action
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _workspace(action, config) {
    const distributor = new Distributor(['prepare', action], config);

    return distributor.run();
  }
}

module.exports = WorkspaceCommand;
