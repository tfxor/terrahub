'use strict';

const glob = require('glob');
const path = require('path');
const { commandsPath } = require('../parameters');

class HelpParser {
  /**
   * Get list of available commands
   * @returns {*}
   */
  static getCommandsNameList() {
    return glob.sync('*.js', { cwd: commandsPath }).map(fileName => path.basename(fileName, '.js'));
  }

  /**
   * @description Returns array of instances of all commands in the project
   * @param {Array} list
   * @returns {Array}
   */
  static getCommandsInstanceList(list = this.getCommandsNameList()) {
    const commands = [];
    list.forEach((commandName) => {
      const Command = require(path.join(commandsPath, commandName));

      const command = new Command(0);
      if (command.getDescription()) {
        commands.push(command);
      }
    });

    return commands;
  }

  /**
   * @description Returns array of objects with command's name, description and available options
   * @param {Array} commands
   * @returns {Array}
   */
  static getCommandsDescription(commands) {
    let result = [];

    commands.forEach((command) => {
      let options = [];

      Object.keys(command._options).forEach(key => {
        let option = command._options[key];

        if (option.defaultValue === process.cwd()) {
          option.defaultValue = 'Terrahub directory';
        }

        options.push(option);
      });

      result.push({
        name: command.getName(),
        description: command.getDescription(),
        options
      });
    });

    return result;
  }
}

module.exports = HelpParser;
