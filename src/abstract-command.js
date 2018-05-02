'use strict';

const fs = require('fs');
const path = require('path');
const { version, description } = require('../package');

class AbstractCommand {
  /**
   * @param {Object} input
   */
  constructor(input) {
    this._input = input;
    this._options = {};

    this.configure();

    if (!this.getName()) {
      throw new Error('The command cannot have an empty name');
    }
  }

  setName(name) {
    this._name = name || false;

    return this;
  }

  getName() {
    return this._name;
  }

  addOption(name, shortcut, description, defaultValue = null) {
    this._options[name] = { name, shortcut, description, defaultValue };

    return this;
  }

  getOption(name) {
    const option = this._options[name];

    return this._input[option.name] || this._input[option.shortcut] || option.defaultValue;
  }

  configure() { throw new Error('Implement...'); }
  run() { throw new Error('Implement...'); }

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
