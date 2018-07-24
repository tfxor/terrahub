'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const { config } = require('../parameters');
const ConfigLoader = require('../config-loader');
const AbstractCommand = require('../abstract-command');
const { isAwsNameValid, extend } = require('../helpers/util');

class ComponentCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('component')
      .setDescription('include existing terraform configuration into current terrahub project')
      .addOption('name', 'n', 'Component name', String)
      .addOption('parent', 'p', 'Parent component path', String, '')
      .addOption('directory', 'd', 'Path to existing component (default: cwd)', String, process.cwd())
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const name = this.getOption('name');
    const parent = this.getOption('parent');
    const directory = path.resolve(this.getOption('directory'));
    const existing = this._findExistingComponent();

    if (!isAwsNameValid(name)) {
      throw new Error('Name is not valid, only letters, numbers, hyphens, or underscores are allowed');
    }

    if (!fse.pathExistsSync(directory)) {
      throw new Error('Can not create because path is invalid');
    }

    let outFile = path.join(directory, config.fileName);
    let component = { name };

    if (parent) {
      component['parent'] = parent;
    }

    if (fs.existsSync(outFile)) {
      throw new Error('Can not create because terraform component already exists');
    }

    if (existing.name) {
      component = extend(existing.config[existing.name], [component]);
      delete existing.config[existing.name];

      ConfigLoader.writeConfig(existing.config, existing.path);
    }

    ConfigLoader.writeConfig(component, outFile);

    return Promise.resolve('Done');
  }

  /**
   * @returns {Object}
   * @private
   */
  _findExistingComponent() {
    let cfgPath = path.resolve(process.cwd(), config.fileName);
    let directory = path.resolve(this.getOption('directory'));
    let componentRoot = this.relativePath(directory);

    if (!fs.existsSync(cfgPath)) {
      throw new Error('Project config not found');
    }

    let name = '';
    let rawConfig = ConfigLoader.readConfig(cfgPath);

    Object.keys(rawConfig).forEach(key => {
      if ('root' in rawConfig[key]) {
        rawConfig[key].root = rawConfig[key].root.replace(/\/$/, '');

        if (rawConfig[key].root === componentRoot) {
          name = key;
        }
      }
    });

    return { name: name, path: cfgPath, config: rawConfig };
  }
}

module.exports = ComponentCommand;
