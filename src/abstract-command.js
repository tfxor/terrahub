'use strict';

const fs = require('fs');
const path = require('path');
const Args = require('../src/helpers/args-parser');
const logger = require('../src/helpers/logger');
const ConfigLoader = require('./config-loader');
const { version, description } = require('../package');

class AbstractCommand {
  /**
   * @param {Object} input
   */
  constructor(input) {
    this._name = null;
    this._input = input;
    this._options = {};
    this._description = null;
    this._configLoader = new ConfigLoader();

    this.configure();
    this.initialize();

    if (!this.getName()) {
      throw new Error('The command cannot have an empty name');
    }
  }

  /**
   * @todo pass into constructor and configure verbosity
   * @returns {Logger}
   */
  get logger() {
    return logger;
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

  /**
   * @todo refactor this!
   */
  static showHelp() {
    const template = fs.readFileSync(path.join(__dirname, './templates/help.tmpl'), 'utf-8');
    const variables = [ version, description ];

    logger.raw(template, ...variables);
  }
}

module.exports = AbstractCommand;
