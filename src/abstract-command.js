'use strict';

const Args = require('../src/helpers/args-parser');
const ConfigLoader = require('./config-loader');
const os = require('os');

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

    this.addOption('help', 'h', 'show command description and available options', Boolean, false);

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
   * @param {Object} type
   * @param {*} defaultValue
   * @returns {AbstractCommand}
   */
  addOption(name, shortcut, description, type = String, defaultValue = undefined) {
    this._options[name] = {name, shortcut, description, type, defaultValue};

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
  initialize() {
  }

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
   * Check Help Flag
   */
  checkHelp() {
    if (this.getDescription() && this.getOption('help') === true) {
      this.showHelp();
      return Promise.reject('help casted')
    }

    let flags = Object.keys(this._input).slice(1);
    const options = Object.values(this._options);

    let option;
    for (option of options) {
      flags = flags.filter(flag => flag !== option.name && flag !== option.shortcut)
    }

    if (flags.length > 0) {
      this.showHelp();
      return Promise.reject('invalid flag(-s)')
    }

    return Promise.resolve()
  }

  /**
   * Show command description and options
   */
  showHelp() {
    let helpString;
    if (this.getName().length < 8) {
      helpString = `\t${this.getName()}\t\t${this.getDescription()}`;
    } else {
      helpString = `\t${this.getName()}\t${this.getDescription()}`;
    }

    helpString += os.EOL + '\tOptions:';

    Object.values(this._options).forEach((option) => {
      if (option.name.length < 6) {
        helpString += os.EOL + `\t--${option.name}\t\t-${option.shortcut}\t${option.description}`;
      } else {
        helpString += os.EOL + `\t--${option.name}\t-${option.shortcut}\t${option.description}`;
      }

      if (option.defaultValue === undefined) {
        helpString += `*`;
      }
    });

    this.logger.log(helpString);
  }
}

module.exports = AbstractCommand;