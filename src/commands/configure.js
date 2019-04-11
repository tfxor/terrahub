'use strict';

const path = require('path');
const ConfigLoader = require('../config-loader');
const TerraformCommand = require('../terraform-command');
const { cfgPath } = require('../parameters');
const { yesNoQuestion } = require('../helpers/util');

class ConfigureCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this.setName('configure')
      .setDescription('add, change or remove config parameters from terrahub config files')
      .addOption('config', 'c', 'Create, update or delete config parameter from config file', String)
      .addOption('global', 'G', 'Update global config file instead of root or local', Boolean, false)
      .addOption('delete', 'D', 'Delete corresponding configuration parameter', Boolean, false)
      .addOption('auto-approve', 'y', 'Auto approve for delete option', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  run() {
    return this.getOption('delete') ? this._deleteConfig() : this._addConfig();
  }

  /**
   * @returns {Promise}
   * @private
   */
  _addConfig() {
    const configContent = this.getOption('config');
    const global = this.getOption('global');
    const data = configContent instanceof Array ? configContent : [configContent];
    const configAction = this.getOption('delete') ? '_deleteFromConfig' : '_updateConfig';

    return this._runAction(global, data, configAction);
  }

  /**
   * @param {Boolean} global
   * @param {Array} data
   * @param {String} configAction
   * @returns {Promise}
   * @private
   */
  _runAction(global, data, configAction) {
    if (global === true) {
      const content = ConfigLoader.readConfig(cfgPath);

      data.forEach(it => this[configAction](it, content));

      ConfigLoader.writeConfig(content, cfgPath);

      return Promise.resolve('Done');
    }

    if (this._isComponentTarget()) {
      const configs = this.getConfig();

      Object.keys(configs).forEach(key => {
        const componentPath = path.join(configs[key].project.root, configs[key].root, this.getFileName());

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
   * @return {Object} // no return, maybe {void}
   * @private
   */
  _deleteFromConfig(string, content) {
    const keys = string.split('.');
    const lastKey = keys.pop();
    let destination = content;

    keys.forEach((it, index) => {
      if (destination[it] && delete [it].hasOwnProperty(it)) {
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
   * @return {Object} // the same {void}
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


  /**
   * @return {Promise}
   * @private
   */
  _deleteConfig() {
    return this._getPromise().then(confirmed => {
      if (!confirmed) {
        return Promise.reject('Action aborted');
      }
      return this._addConfig();
    });
  }

  /**
   * @return {Promise}
   * @private
   */
  _getPromise() {
    if (this.getOption('auto-approve')) {
      return Promise.resolve(true);
    } else {
      const global = this.getOption('global');
      const projectName = this.getProjectConfig().name;
      let configDirectory;

      if (!global) {
        configDirectory = this._getTargetName(this.getOption('var-file'));
      } else {
        configDirectory = `global|${projectName}`;
      }

      return yesNoQuestion(`Do you want to delete from (${configDirectory}) '.terrahub.yml' config value associated with ${this.getOption('config')} (y/N)?`);
    }
  }

  /**
   * @return {Boolean}
   * @private
   */
  _isComponentTarget() {
    return ['include', 'exclude', 'exclude-regex', 'include-regex'].some(it => this.getOption(it).length);
  }

  /**
   * @param {Array} componentName
   * @return {String}
   * @private
   */
  _getTargetName(componentName) {
    const configs = this.getConfig();

    if (Array.isArray(componentName) && componentName.length) {
      const id = Object.keys(configs).find(key => configs[key].name === componentName.toString());
      if (!id) {
        throw new Error(`Component with name ${componentName}, not found in ${this.getProjectConfig().name}`);
      }

      return configs[id].name;
    }

    return Object.keys(configs).map(key => configs[key].name).sort().join(', ');
  }
}

module.exports = ConfigureCommand;
