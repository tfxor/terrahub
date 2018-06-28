'use strict';

const { templates } = require('./parameters');
const { renderTwig } = require('./helpers/util');
const AbstractCommand = require('./abstract-command');

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

    return version ? this.showVersion() : this.showHelp();
  }

  /**
   * @return {Promise}
   */
  showVersion() {
    const { version } = require(templates.helpMetadata);

    return Promise.resolve(`v${version}`);
  }

  /**
   * @return {Promise}
   */
  showHelp() {
    const { version, description, buildDate, commands } = require(templates.helpMetadata);

    commands.forEach((command) => {
      command.separator = '.'.repeat(20 - command.name.length);
    });

    return renderTwig(templates.helpDefault, {
      version: version,
      buildDate: buildDate,
      description: description,
      commands: commands
    }).then(result => {
      this.logger.log(result);
    });
  }
}

module.exports = HelpCommand;
