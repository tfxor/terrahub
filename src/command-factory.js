'use strict';

const fs = require('fs');
const path = require('path');
const parseArgs = require('minimist');
const AbstractCommand = require('./abstract-command');

class CommandFactory {

  static create(argv) {
    const [,, command, ...args] = argv;

    if (CommandFactory.listCommands().includes(command)) {
      const Command = require(path.join(CommandFactory.commandsPath, command));

      return new Command(parseArgs(args));
    // } else if(['-h', '--help'].includes(command.toLowerCase())) {
    //   AbstractCommand.showHelp();
    } else {
      throw new Error(`${command} is not implemented!`);
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
