'use strict';

const fs = require('fs');
const path = require('path');
const Args = require('./helpers/args-parser');
const { commandsPath } = require('./parameters');

class CommandFactory {
  /**
   * Command create
   * @param {Array} argv
   * @param {Logger|*} logger
   * @returns {*}
   */
  static create(argv, logger = console) {
    const [command, ...args] = argv.slice(2);

    try {
      const Command = require(path.join(commandsPath, command));

      return new Command(Args.parse(args), logger);
    } catch (err) {
      const Help = require('./help');

      return new Help(Args.parse(argv), logger);
    }
  }

  /**
   * Get list of available commands
   * @returns {*}
   */
  static listCommands() {
    return fs
      .readdirSync(commandsPath)
      .map(fileName => path.basename(fileName, '.js'));
  }
}

module.exports = CommandFactory;
