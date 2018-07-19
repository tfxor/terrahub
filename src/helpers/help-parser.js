'use strict';

const glob = require('glob');
const path = require('path');
const { commandsPath, templates } = require('../parameters');

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
    return list.map(commandName => {
      const Command = require(path.join(commandsPath, commandName));
      return new Command(0);
    });
  }

  /**
   * @description Returns array of objects with command's name, description and available options
   * @param {Array} commands
   * @returns {Array}
   */
  static getCommandsDescriptionList(commands) {
    return commands.map(command => {
      const options = Object.keys(command._options).map(key => {
        let option = command._options[key];

        if (option.defaultValue === process.cwd()) {
          option.defaultValue = 'Project directory';
        }
      });

      return {
        name: command.getName(),
        description: command.getDescription(),
        options: options
      };
    });
  }

  /**
   * @param {String} command
   * @param {Object} args
   * @return {Boolean}
   */
  static hasInvalidOptions(command, args) {
    return false;

    const metadata = require(templates.helpMetadata);
    const options = metadata.commands.find(it => it.name === command).options;

    return !Object.keys(args).every(arg => options.find(it => it.name === arg || it.shortcut === arg));
  }
}

module.exports = HelpParser;
