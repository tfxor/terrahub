'use strict';

const glob = require('glob');
const path = require('path');
const logger = require('./logger');
const fs = require('fs-extra');
const { commandsPath, templates, packageJson } = require('../parameters');

class HelpParser {
  /**
   * Return list of available commands
   * @return {String[]}
   */
  static getCommandsNameList() {
    return glob.sync('*.js', { cwd: commandsPath }).map(fileName => path.basename(fileName, '.js'));
  }

  /**
   * Return array of instances of all commands in the project
   * @param {Array} list
   * @return {Array}
   * @private
   */
  static getCommandsInstances(list = this.getCommandsNameList()) {
    return list.map(commandName => {
      const Command = require(path.join(commandsPath, commandName));
      return new Command(0, logger);
    });
  }

  /**
   * Return array of objects with command's name, description, available options and category
   * @param {AbstractCommand[]} commands
   * @return {Object[]}
   * @private
   */
  static getCommandsDescription(commands) {
    return commands.map(command => {
      const options = Object.keys(command._options).map(key => {
        let option = command._options[key];

        if (option.defaultValue === process.cwd()) {
          option.defaultValue = 'Current working directory';
        }

        return option;
      });

      return {
        name: command.getName(),
        description: command.getDescription(),
        options: options
      };
    });
  }

  /**
   * Updates metadata with new helper info
   * @param {Boolean} updateBuildDate
   */
  static updateMetadata(updateBuildDate = true) {
    const packageContent = require(packageJson);
    const commands = HelpParser.getCommandsInstances();
    const commandsDescription = HelpParser.getCommandsDescription(commands);
    const { buildDate } = require('../templates/help/metadata');

    const json = {
      name: packageContent.name,
      version: packageContent.version,
      description: packageContent.description,
      buildDate: updateBuildDate ? (new Date).toISOString() : buildDate,
      commands: commandsDescription
    };

    fs.writeJsonSync(templates.helpMetadata, json, { spaces: 2 });
  }

  /**
   * Determines whether all the options are valid for the command
   * @param {String} command
   * @param {Object} args
   * @return {Boolean}
   */
  static hasInvalidOptions(command, args) {
    const metadata = require(templates.helpMetadata);
    const options = metadata.commands.find(it => it.name === command).options;

    return !Object.keys(args).every(arg => options.find(it => it.name === arg || it.shortcut === arg));
  }
}

module.exports = HelpParser;
