'use strict';

const parameters = require('./parameters');
const AbstractCommand = require('./abstract-command');
const { renderTwig } = require('./helpers/util');

class HelpCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('help')
      .setDescription('options available without a command entered')
      .addOption('help', 'h', 'Show list of available commands', Boolean, false)
      .addOption('version', 'v', 'Show current version of the tool', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  run() {
    const version = this.getOption('version');

    if (version) {
      return this.showVersion();
    }

    return this.showHelp();
  }

  showVersion() {
    const { version } = require(parameters.templates.helpMetadata);

    return Promise.resolve(`v${version}`);
  }

  showHelp() {
    const { version, description, buildDate, commands } = require(parameters.templates.helpMetadata);

    commands.forEach((command) => {
      command.separator = '.'.repeat(20 - command.name.length);
    });

    return renderTwig(parameters.templates.helpDefault, {
      version: version,
      buildDate: buildDate,
      description: description,
      commands: commands
    }).then(result => {
      console.log(result);
    });
  }
}

module.exports = HelpCommand;
