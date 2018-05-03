'use strict';

const fs = require('fs');
const path = require('path');
const ConfigLoader = require('./config-loader');
const { version, description } = require('../package');

class AbstractCommand {
  /**
   * @param {Object} input
   */
  constructor(input) {
    this._name = null;
    this._input = input;
    this._config = null;
    this._options = {};
    this._description = null;
    this._configLoader = new ConfigLoader();

    this.configure();

    if (!this.getName()) {
      throw new Error('The command cannot have an empty name');
    }
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
   * @param {*} defaultValue
   * @returns {AbstractCommand}
   */
  addOption(name, shortcut, description, defaultValue = null) {
    this._options[name] = { name, shortcut, description, defaultValue };

    return this;
  }

  /**
   * Get option value
   * @param {String} name
   * @returns {*}
   */
  getOption(name) {
    const option = this._options[name];

    return this._input[option.name] || this._input[option.shortcut] || option.defaultValue;
  }

  run() { throw new Error('Implement...'); }
  configure() { throw new Error('Implement...'); }


  /**
   * Get list of configuration files
   * @param {*} dir
   * @returns {String[]}
   */
  listConfigs(dir) {
    return this._configLoader.listConfigs(dir);
  }

  /**
   * Get consolidated config
   * @returns {Object}
   */
  getConfig() {
    if (!this._config) {
      this._config = this._configLoader.getFullConfig();
    }

    return this._config;
  }


  /**
   * @todo refactor this!
   */
  static showHelp() {
    const template = fs.readFileSync(path.join(__dirname, './help.tmpl'), 'utf-8');
    const variables = [
      version,
      description
    ];

    console.log(template, ...variables);
  }
}

module.exports = AbstractCommand;
