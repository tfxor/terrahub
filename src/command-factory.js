'use strict';

const fs = require('fs');
const path = require('path');
const Args = require('./helpers/args-parser');

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
      const Command = require(path.join(CommandFactory.commandsPath, command));

      return new Command(Args.parse(args), logger);
    } catch (err) {
      const Command = require(path.join(CommandFactory.commandsPath, 'default'));

      return new Command(Args.parse(argv), logger);
    }
  }

  /**
   * Get list of available commands
   * @returns {*}
   */
  static listCommands() {
    return fs
      .readdirSync(CommandFactory.commandsPath)
      .map(fileName => path.basename(fileName, '.js'));
  }

  /**
   * Directory with command classes
   * @returns {*}
   */
  static get commandsPath() {
    return path.join(__dirname, 'commands');
  }
}

module.exports = CommandFactory;
