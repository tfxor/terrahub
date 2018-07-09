'use strict';

const Args = require('../src/helpers/args-parser');
const { config } = require('./parameters');
const ConfigLoader = require('./config-loader');

class AbstractCommand {
  /**
   * @param {Object} input
   * @param {Logger} logger
   */
  constructor(input, logger) {
    this.logger = logger;
    this._name = null;
    this._input = input;
    this._options = {};
    this._description = null;
    this._configLoader = new ConfigLoader();

    this.configure();
    this.initialize();
    this._addDefaultOptions();

    if (!this.getName()) {
      throw new Error('The command cannot have an empty name');
    }
  }

  /**
   * Globally available options
   */
  _addDefaultOptions() {
    this
      .addOption('env', 'e', 'Workspace environment', String, config.env)
      .addOption('help', 'h', 'Show list of available commands', Boolean, false);
  }

  /**
   * Configure command name
   * @param {String} name
   * @returns {AbstractCommand}
   */
  setName(name) {
    this._name = name;

    return this;
  }

  /**
   * @returns {String}
   */
  getName() {
    return this._name;
  }

  /**
   * Configure command description
   * @param {String} description
   * @returns {AbstractCommand}
   */
  setDescription(description) {
    this._description = description;

    return this;
  }

  /**
   * @returns {String}
   */
  getDescription() {
    return this._description;
  }

  /**
   * Configure command option
   * @param {String} name
   * @param {String} shortcut
   * @param {String} description
   * @param {Object} type
   * @param {*} defaultValue
   * @returns {AbstractCommand}
   */
  addOption(name, shortcut, description, type = String, defaultValue = undefined) {
    this._options[name] = { name, shortcut, description, type, defaultValue };

    return this;
  }

  /**
   * Get option value
   * @param {String} name
   * @returns {*}
   */
  getOption(name) {
    if (!this._options.hasOwnProperty(name)) {
      return undefined;
    }

    const option = this._options[name];
    const rawValue = this._input[option.name] || this._input[option.shortcut] || option.defaultValue;

    return Args.convert(option.type, rawValue);
  }

  /**
   * Abstract configure method
   */
  configure() {
    throw new Error('Implement configure() method...');
  }

  /**
   * Abstract initialize method (optional)
   */
  initialize() {}

  /**
   * Abstract run method
   * @returns {Promise}
   */
  run() {
    return Promise.reject(new Error('Implement run() method...'));
  }

  /**
   * Command validation
   * @returns {Promise}
   */
  validate() {
    const required = Object.keys(this._options).filter(name => {
      return typeof this.getOption(name) === 'undefined';
    });

    if (required.length > 0) {
      return Promise.reject(
        new Error(`Missing required options: ${required.map(x => `--${x}`).join(', ')}`)
      );
    }

    return Promise.resolve();
  }

  /**
   * Get list of configuration files
   * @param {String|Boolean} dir
   * @returns {String[]}
   */
  listConfigs(dir = false) {
    return this._configLoader.listConfigs(dir);
  }

  /**
   * Get full consolidated config
   * @returns {Object}
   */
  getConfig() {
    return this._configLoader.getFullConfig();
  }

  /**
   * @returns {Object}
   */
  getProjectConfig() {
    return this._configLoader.getProjectConfig();
  }

  /**
   * @param {String} fullPath
   * @returns {String}
   */
  relativePath(fullPath) {
    return this._configLoader.relativePath(fullPath);
  }

  /**
   * Reload config loader
   * @deprecated
   */
  reloadConfig() {
    this._configLoader = new ConfigLoader();
  }
}

module.exports = AbstractCommand;
