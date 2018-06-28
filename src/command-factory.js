'use strict';

const path = require('path');
const HelpParser = require('./helpers/help-parser');
const HelpCommand = require('./commands/.help');
const { commandsPath, config, args } = require('./parameters');

class CommandFactory {
  /**
   * Command create
   * @param {Logger|*} logger
   * @returns {*}
   */
  static create(logger = console) {
    const command = args._.shift();
    delete args._;

    if (!HelpParser.getCommandsNameList().includes(command) || config.isHelp) {
      args.command = command;
      return new HelpCommand(args, logger);
    }

    const Command = require(path.join(commandsPath, command));
    return new Command(args, logger);
  }
}

module.exports = CommandFactory;
