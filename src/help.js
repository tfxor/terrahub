'use strict';

const fs = require('fs');
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
      .addOption('version', 'v', 'Show current version of the application', Boolean, false);
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
    const appInfo = JSON.parse(fs.readFileSync(parameters.packageJson, 'utf8'));

    return Promise.resolve(`v${appInfo.version}`);
  }

  showHelp() {
    const commands = JSON.parse(fs.readFileSync(parameters.templates.helpMetadata, 'utf8'));
    const { version, description, buildDate } = JSON.parse(fs.readFileSync(parameters.packageJson, 'utf8'));

    commands.forEach((command) => {
      if (command.name.length < 6) {
        command.name += '\t\t';
      } else {
        command.name += '\t';
      }
    });

    return renderTwig(parameters.templates.terrahubHelp, {
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