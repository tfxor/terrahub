'use strict';

const fs = require('fs');
const parameters = require('./parameters');
const AbstractCommand = require('./abstract-command');
const os = require('os');
const path = require('path');

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
      this.showVersion();
    } else {
      this.showHelp();
    }

    return Promise.resolve();
  }

  showVersion() {
    // @todo: move this into abstract and don't reference as `./`
    const appInfo = JSON.parse(fs.readFileSync('./package.json'));

    console.log(`v${appInfo.version}`);
  }

  showHelp() {
    const help = JSON.parse(fs.readFileSync(parameters.helpJSON));

    // @todo: move this code block into template file
    let helpString = '';
    help.forEach((command) => {
      if (command.name.length < 8) {
        helpString += os.EOL + `\t${command.name}\t\t${command.description}`;
      } else {
        helpString += os.EOL + `\t${command.name}\t${command.description}`;
      }
    });

    const template = fs.readFileSync(parameters.templates.help, 'utf-8');
    // @todo: move this into abstract and don't reference as `./`
    const appInfo = JSON.parse(fs.readFileSync('./package.json'));

    console.log(template, appInfo.version, appInfo.description, helpString.substring(1));
  }
}

module.exports = HelpCommand;