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
      .addOption('version', 'v', 'Show current version of the tool', Boolean, false)
    ;

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
      let command = allCommands.find(item => item.name === commandName);

      const invalids = this.getInvalidOptions(command);

      if (invalids.length > 0) {
        this.logger.error(`The following options are not valid: --${ invalids.join(', --') }`);
      }

      variables.commandName = commandName;
      variables.commandDescription = command.description;
      variables.options = command.options.map(option => {
        option.separator = (option.name.length < 7) ? '\t\t' : '\t';
        return option;
      });
    } else {
      const command = this.getOption('command');
      if (command) {
        this.logger.error(`The following command is not valid: ${command}`);
      }

      variables.terraformExecution = [];
      variables.terrahubManagement = [];
      variables.cloudAutomation = [];

      allCommands.forEach(command => {
        command.separator = '.'.repeat(20 - command.name.length);

        if (['component', 'configure', 'convert', 'graph', 'project'].includes(command.name)) {
          variables.terrahubManagement.push(command);
        } else if (['build', 'list', 'run'].includes(command.name)) {
          variables.cloudAutomation.push(command);
        } else {
          variables.terraformExecution.push(command);
        }
      });
    }

    return renderTwig(template, variables).then(result => {
      this.logger.log(result);
    });
  }

  /**
   * @desc Return array of invalid options for the provided command
   * @param {Object} command
   * @return {String[]}
   */
  getInvalidOptions(command) {
    const args = Object.assign({}, this._input);
    delete args.command;

    return Object.keys(args).filter(arg =>
      !command.options.find(it => it.name === arg || it.shortcut === arg));
  }
}

module.exports = Help;
