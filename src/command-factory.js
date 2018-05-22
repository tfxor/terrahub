'use strict';

const fs = require('fs');
const path = require('path');
const parseArgs = require('minimist');

class CommandFactory {
  /**
   * Command create
   * @param {Array} argv
   */
  static create(argv) {
    const [command, ...args] = argv.slice(2);

    try {
      const Command = require(path.join(CommandFactory.commandsPath, command));

      return new Command(parseArgs(args));
    } catch (err) {
      throw err;
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
