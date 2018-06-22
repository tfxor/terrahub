'use strict';

const Args = require('../src/helpers/args-parser');
const ConfigLoader = require('./config-loader');

class AbstractCommand {
  /**
   * @param {Object} input
   * @param {Logger} logger
   */
  constructor(input, logger) {
    this.logger = logger;
    this._input = input;
    this._configLoader = new ConfigLoader();

    this.initialize();

    if (!this.constructor.name) {
      throw new Error('The command cannot have an empty name');
    }
  }

  /**
   * @returns {String}
   */
  static get name() {}

  /**
   * @returns {String}
   */
  static get description() {}

  /**
   * Configure command option
   * @param {String} name
   * @param {String} shortcut
   * @param {String} description
   * @param {Object} type
   * @param {*} defaultValue
   * @returns {Object}
   */
  static get options() {
    return {}
  }

  /**
   * Get option value
   * @param {String} name
   * @returns {*}
   */
  getOption(name) {
    if (!this.constructor.options.hasOwnProperty(name)) {
      return undefined;
    }

    const option = this.constructor.options[name];
    const rawValue = this._input[option.name] || this._input[option.shortcut] || option.defaultValue;

    return Args.convert(option.type, rawValue);
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
    const required = Object.keys(this.constructor.options).filter(name => {
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
   * @param {String} dir
   * @returns {String[]}
   */
  listConfigs(dir) {
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
}

Object.prototype.addOption = function (name, shortcut, description, type, defaultValue = undefined) {
  this[name] = {name, shortcut, description, type, defaultValue};
  return this;
};

module.exports = AbstractCommand;
