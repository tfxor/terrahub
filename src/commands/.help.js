'use strict';

const HelpParser = require('../helpers/help-parser');
const { templates } = require('../parameters');
const { renderTwig } = require('../helpers/util');
const AbstractCommand = require('../abstract-command');

class Help extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('help')
      .setDescription('options available without a command entered')
      .addOption('command', 'c', 'Show command related help', String, '')
      .addOption('version', 'v', 'Show current version of the tool', Boolean, false);

    this.metadata = require(templates.helpMetadata);
  }

  /**
   * @returns {Promise}
   */
  run() {
    const cmd = this.getOption('command');
    const version = this.getOption('version');
    const command = HelpParser.getCommandsNameList().includes(cmd) ? cmd : '';

    return version
      ? this.showVersion()
      : this.showHelp(command);
  }

  /**
   * @return {Promise}
   */
  showVersion() {
    this.logger.log(`v${this.metadata.version}`);

    return Promise.resolve();
  }

  /**
   * @param {String} commandName
   * @return {Promise}
   */
  showHelp(commandName) {
    let template = templates.helpDefault;
    let allCommands = this.metadata.commands;
    let variables = {
      version: this.metadata.version,
      buildDate: this.metadata.buildDate,
      description: this.metadata.description
    };

    if (commandName) {
      template = templates.helpCommand;
      const invalidOptionsTemplate = templates.invalidOptions;
      let command = allCommands.find(item => item.name === commandName);

      const invalidOptions = this.getInvalidOptions(command);

      renderTwig(invalidOptionsTemplate, {
        options: invalidOptions
      }).then(result => {
        this.logger.log(result);
      });

      variables.commandName = commandName;
      variables.commandDescription = command.description;
      variables.options = command.options.map(option => {
        option.separator = (option.name.length < 7) ? '\t\t' : '\t';
        return option;
      });
    } else {
      variables.commands = allCommands.map(command => {
        command.separator = '.'.repeat(20 - command.name.length);
        return command;
      });
    }

    return renderTwig(template, variables).then(result => {
      this.logger.log(result);
    });
  }

  /**
   * @param {Object} command
   * @return {Array}
   */
  getInvalidOptions(command) {
    const args = Object.assign({}, this._input);
    delete args.command;

    return Object.keys(args).filter(arg =>
      typeof command.options.find(it => it.name === arg || it.shortcut === arg) === 'undefined');
  }
}

module.exports = Help;
