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
    const data = configContent instanceof Array ? configContent : [configContent];

    if (global === true) {
      const content = ConfigLoader.readConfig(cfgPath);

      data.forEach(it => this._updateConfig(it, content));
      ConfigLoader.writeConfig(content, cfgPath);

      return Promise.resolve('Done');
    }

    if ([this.getOption('include'), this.getOption('exclude'),
      this.getOption('exclude-regex'), this.getOption('include-regex')].some(it => it.length)) {
      const configs = this.getConfig();

      Object.keys(configs).forEach(key => {
        const componentPath = path.join(configs[key].project.root, configs[key].root, config.defaultFileName);

        const content = ConfigLoader.readConfig(componentPath);

        data.forEach(it => this._updateConfig(it, content));
        ConfigLoader.writeConfig(content, componentPath);
      });

      return Promise.resolve('Done');
    }

    const rootConfigPath = path.join(this.getAppPath(), config.defaultFileName);
    const content = ConfigLoader.readConfig(rootConfigPath);

    data.forEach(it => this._updateConfig(it, content));
    ConfigLoader.writeConfig(content, rootConfigPath);

    return Promise.resolve('Done');
  }

  /**
   * @param string
   * @param content
   * @private
   */
  _updateConfig(string, content) {
    const regex = /([^[]+)\[\d*]/;
    let [keyString, ...value] = string.split('=');

    value = value.join('=');

    let destination = content;
    const keys = keyString.split('.');

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      destination = this._intermidiateFill(destination, key, regex);
    }
    const lastKey = keys[keys.length - 1];
    const match = lastKey.match(regex);
    const finalKey = match ? match.slice(-2)[1] : lastKey;

    let load;
    try {
      load = JSON.parse(value);
    } catch (error) {
      load = value;
    }

    if (match) {
      if (!destination[finalKey] || !(destination[finalKey] instanceof Array)) {
        destination[finalKey] = [];
      }

      destination[finalKey].push(load);
    } else {
      destination[finalKey] = load;
    }
  }

  /**
   * @param destination
   * @param key
   * @param regex
   * @private
   */
  _intermidiateFill(destination, key, regex) {
    const match = key.match(regex);
    const finalKey = match ? match.slice(-2)[1] : key;
    const value = match ? [] : {};

    if (destination instanceof Array) {
      destination.push(value);
      destination = destination[destination.length - 1];
    } else {
      if (!match && !destination.hasOwnProperty(finalKey)) {
        destination[finalKey] = value;
      }
      destination = destination[finalKey];
    }

    return destination;
  }
}

module.exports = ConfigureCommand;