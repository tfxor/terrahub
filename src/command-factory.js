'use strict';

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
      const HelpCommand = require('./help-command');

      return new HelpCommand(Args.parse(argv), logger);
    }
  }
}

module.exports = CommandFactory;
