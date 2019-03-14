'use strict';

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const treeify = require('treeify');
const ConfigLoader = require('../config-loader');
const HashTable = require('../helpers/hash-table');
const { config, templates } = require('../parameters');
const TerraformCommand = require('../terraform-command');
const { renderTwig, yesNoQuestion } = require('../helpers/util');
const Distributor = require('../helpers/distributors/thread-distributor');

class WorkspaceCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('workspace')
      .setDescription('run `terraform workspace` across multiple terrahub components')
      .addOption('delete', 'D', 'Delete workspace environment (paired with --env)', Boolean, false)
      .addOption('list', 'L', 'Shows list of terrahub components', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const promises = [];
    let filesToRemove = [];
    const kill = this.getOption('delete');
    const configs = this.getConfigObject();

    const rootPath = this.getAppPath();
    const rootConfigPath = path.join(rootPath, this.getDefaultFileName());

    const dirPaths = Object.keys(configs).map(hash => path.join(rootPath, configs[hash].root));
    const configsList = dirPaths.map(it => path.join(it, this.getDefaultFileName()));
    const envConfigsList = this.listCurrentEnvConfig();

    const nonIncludedComponents = envConfigsList.slice(1).filter(it => !dirPaths.includes(path.dirname(it)));
    const includeRootConfig = !kill || (kill && !nonIncludedComponents.length);

    if (this.getOption('list')) {
      this.logger.log(`Project: ${this.getProjectConfig.name}`);
      return this._workspace('workspaceList', configs)
        .then(results => this._handleWorkspaceList(results))
        .then(() => 'Done');
    }
    if (includeRootConfig) {
      configsList.unshift(rootConfigPath);
    }

    const { name, code } = this.getProjectConfig();
    if (config.isDefault) {
      return this._workspace('workspaceSelect', configs).then(() => 'Done');
    }

    configsList.forEach((configPath, i) => {
      const dir = path.dirname(configPath);
      const envConfig = path.join(dir, this.getFileName());
      const tfvarsName = path.join('workspace', `${config.env}.tfvars`);
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

        if (i !== 0 || !includeRootConfig) { // Skip root path
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
      let isUpdate = promises.length !== (configsList.length - 1);
      let message = `TerraHub environment '${config.env}' was ${ isUpdate ? 'updated' : 'created' }`;

      return Promise
        .all(promises)
        .then(() => this._workspace('workspaceSelect', cfgObject))
        .then(() => Promise.resolve(message));
    }

    return yesNoQuestion(`Do you want to delete workspace '${config.env}' (Y/N)? `).then(confirmed => {
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
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _workspace(action, config) {
    const distributor = new Distributor(config);

    this.warnExecutionStarted(config);

    return distributor.runActions(['prepare', action], {
      silent: this.getOption('silent')
    });
  }

  /**
   * @param {Object[]} results
   * @private
   */
  _handleWorkspaceList(results) {
    const result = results.reduce((acc, item) => {
      item.workspaces.filter(it => !acc[it]).forEach(it => acc[it] = {});
      acc[item.activeWorkspace][item.component] = null;

      return acc;
    }, {});

    treeify.asLines(result, false, line => {
      this.logger.log(` ${line}`);
    });
  }
}

module.exports = WorkspaceCommand;
