'use strict';

const path = require('path');
const ConfigLoader = require('../config-loader');
const TerraformCommand = require('../terraform-command');
const { config, cfgPath } = require('../parameters');

class ConfigureCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this.setName('configure')
      .setDescription('add, update or remove data from terrahub config files')
      .addOption('config', 'c', 'config', String, '')
      .addOption('global', 'G', 'fefgjiosgis', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  run() {
    const configContent = this.getOption('config');
    const global = this.getOption('global');

    if (global === true) {
      let content = ConfigLoader.readConfig(cfgPath);
      let finalContent = this._updateConfig(configContent, content);
      ConfigLoader.writeConfig(finalContent, cfgPath);

      return Promise.resolve('Done');
    }

    if ([this.getOption('include'), this.getOption('exclude'),
      this.getOption('exclude-regex'), this.getOption('include-regex')].some(it => it.length)) {
      const configs = this.getConfig();

      Object.keys(configs).forEach(key => {
        const componentPath = path.join(
          configs[key].project.root,
          configs[key].root,
          config.defaultFileName
        );

        let content = ConfigLoader.readConfig(componentPath);
        let finalContent = this._updateConfig(configContent, content);

        ConfigLoader.writeConfig(finalContent, componentPath);
      });

      return Promise.resolve('Done');
    }

    const rootPath = this.getAppPath();
    const rootConfigPath = path.join(rootPath, config.defaultFileName);
    let content = ConfigLoader.readConfig(rootConfigPath);
    let finalContent = this._updateConfig(configContent, content);
    ConfigLoader.writeConfig(finalContent, rootConfigPath);

    return Promise.resolve('Done');
  }

  /**
   *
   */
  _updateConfig(string, content) {

    const obj = content;
    let [keyString, ...value] = '';
    let condition = string instanceof Array;
    let forCondition = condition ? string.length : 1;

    for (let y = 0; y < forCondition; y++) {
      [keyString, ...value] = condition === true ? string[y].split('=') : string.split('=');
      const keys = keyString.split('.');
      let destination = obj;
      let i = 0;

      for (i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (/\[\d*\]/.test(key)) {
          if (destination instanceof Array) {
            destination.push([]);
            destination = destination[destination.length - 1];
          } else {
            destination[key] = [];
            destination = destination[key];
          }
        } else {
          if (destination instanceof Array) {
            destination.push({});
            destination = destination[destination.length - 1];
          } else {
            if (!destination.hasOwnProperty(key)) {
              destination[key] = {};
            }
            destination = destination[key];
          }
        }
      }
      
      if (destination instanceof Array) {
        destination.push(value);
      } else {
        try {
          if (/\[\d*\]/.test(keyString)) {
            destination[keys[keys.length - 1].slice(0, -2)].push(JSON.parse(value));
          } else {
            destination[keys[keys.length - 1]] = JSON.parse(value);
          }
        } catch (error) {
          if (/\[\d*\]/.test(keyString) === true) {
            destination[keys[keys.length - 1].slice(0, -2)] = [];
            destination[keys[keys.length - 1].slice(0, -2)].push(JSON.parse(value));
          } else {
            destination[keys[keys.length - 1]] = value;
          }
        }
      }
    }
    return obj;
  }
}

module.exports = ConfigureCommand;
