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
      .setDescription('run `terraform workspace` across multiple terrahub components')
      .addOption('delete', 'd', 'Delete workspace environment (paired with --env)', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const promises = [];
    let filesToRemove = [];
    const kill = this.getOption('delete');
    const configs = this.listConfig();
    const { name, code } = this.getProjectConfig();

    if (config.isDefault) {
      return this._workspace('workspaceSelect', this.getConfigObject()).then(() => 'Done');
    }

    configs.forEach((configPath, i) => {
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

        if (i !== 0) { // Skip root path
          promises.push(renderTwig(template, { name, code, env: config.env }, tfvarsPath));
        }
      }

      if (fs.existsSync(envConfig) && kill) {
        filesToRemove.push(envConfig, tfvarsPath);
      }
    });

    this.reloadConfig();
    const cfgObject = this.getConfigObject();

    if (!kill) {
      let isUpdate = promises.length !== (configs.length - 1);
      let message = `TerraHub environment '${config.env}' was ${ isUpdate ? 'updated' : 'created' }`;

      return Promise
        .all(promises)
        .then(() => this._workspace('workspaceSelect', cfgObject))
        .then(() => Promise.resolve(message));
    }

    return yesNoQuestion('Are you sure (Y/N)? ').then(confirmed => {
      if (!confirmed) {
        return Promise.resolve('Canceled');
      }

      filesToRemove = filesToRemove.filter(file => fs.existsSync(file));

      if (!filesToRemove.length) {
        return Promise.resolve('Nothing to remove');
      }

      return Promise
        .all(filesToRemove.map(file => fse.unlink(file)))
        .then(() => this._workspace('workspaceDelete', cfgObject))
        .then(() => Promise.resolve(`TerraHub environment '${config.env}' was deleted`));
    });
  }

  /**
   * @param {String} action
   * @param {Object[]} config
   * @return {Promise}
   * @private
   */
  _workspace(action, config) {
    const distributor = new Distributor(config);

    return distributor.runActions(['prepare', action], false);
  }
}

module.exports = WorkspaceCommand;
