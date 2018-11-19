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
      .setDescription('add, change or remove config parameters from terrahub config files')
      .addOption('config', 'c', 'Create, update or delete config parameter from config file', String, '')
      .addOption('global', 'G', 'Update global config file instead of root or local', Boolean, false)
      .addOption('delete', 'D', 'Delete corresponding configuration parameter', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  run() {
    const configContent = this.getOption('config');

    if(!configContent) {
      throw new Error(`Missing required options: --config`)
    }

    const global = this.getOption('global');
    const data = configContent instanceof Array ? configContent : [configContent];
    const configAction = this.getOption('delete') ? '_deleteFromConfig' : '_updateConfig';

    if (global === true) {
      const content = ConfigLoader.readConfig(cfgPath);

      data.forEach(it => this[configAction](it, content));

      ConfigLoader.writeConfig(content, cfgPath);

      return Promise.resolve('Done');
    }

    if ([this.getOption('include'), this.getOption('exclude'),
      this.getOption('exclude-regex'), this.getOption('include-regex')].some(it => it.length)) {
      const configs = this.getConfig();

      Object.keys(configs).forEach(key => {
        const componentPath = path.join(configs[key].project.root, configs[key].root, this.getDefaultFileName());

        const content = ConfigLoader.readConfig(componentPath);

        data.forEach(it => this[configAction](it, content));

        ConfigLoader.writeConfig(content, componentPath);
      });

      return Promise.resolve('Done');
    }

    const rootConfigPath = path.join(this.getAppPath(), this.getDefaultFileName());
    const content = ConfigLoader.readConfig(rootConfigPath);

    data.forEach(it => this[configAction](it, content));
    ConfigLoader.writeConfig(content, rootConfigPath);

    return Promise.resolve('Done');
  }

  /**
   * @param {String} string
   * @param {Object} content
   * @return {Object}
   * @private
   */
  _deleteFromConfig(string, content) {
    const keys = string.split('.');
    const lastKey = keys.pop();
    let destination = content;

    keys.forEach((it, index) => {
      if (destination[it] && delete[it].hasOwnProperty(it)) {
        destination = destination[it];
      } else {
        throw new Error(`The given key doesn't exist in config: ${keys.slice(0, index + 1).join('.')}`);
      }
    });

    if (destination.hasOwnProperty(lastKey)) {
      delete destination[lastKey];

      if (!Object.keys(destination).length) {
        this._cleanConfig(content, keys);
      }
    } else {
      throw new Error(`The given key doesn't exist in config: ${string}`);
    }
  }

  /**
   * @param {Object} destination
   * @param {Array} keys
   * @private
   */
  _cleanConfig(destination, keys) {

    if (keys.length !== 1) {
      this._cleanConfig(destination[keys[0]], keys.slice(1));
    }

    if (!Object.keys(destination[keys[0]]).length) {
      delete destination[keys[0]];
    }
  }

  /**
   * @param {String} string
   * @param {Object} content
   * @return {Object}
   * @private
   */
  _updateConfig(string, content) {
    const regex = /([^[]+)\[\d*]/;
    let [keyString, ...value] = string.split('=');

    value = value.join('=');
    let destination = content;

    const keys = keyString.split('.');
    const lastKey = keys.pop();

    keys.forEach(key => {
      destination = this._intermediateFill(destination, key, regex);
    });

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
   * @param {Object|Array} destination
   * @param {String} key
   * @param {RegExp} regex
   * @return {Object|Array}
   * @private
   */
  _intermediateFill(destination, key, regex) {
    const match = key.match(regex);
    const finalKey = match ? match.slice(-2)[1] : key;
    const value = match ? [] : {};

    if (destination instanceof Array) {
      destination.push(value);
      destination = destination[destination.length - 1];
    } else {
      if (!match && !(destination[finalKey] instanceof Object)) {
        destination[finalKey] = value;
      }
      destination = destination[finalKey];
    }

    return destination;
  }
}

module.exports = ConfigureCommand;
