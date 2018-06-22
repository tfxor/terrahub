'use strict';

const fs = require('fs');
const path = require('path');
const parameters = require('./parameters');
const AbstractCommand = require('./abstract-command');
const { commandsPath } = require('./parameters');
const { helpJSON } = require('./parameters');

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
    const appInfo = JSON.parse(fs.readFileSync('./package.json'));

    console.log(`v${appInfo.version}`);
  }

  showHelp() {
    const help = JSON.parse(fs.readFileSync(helpJSON));

    // @todo: move this code block into template file
    let helpOptions = '';
    help.forEach((command) => {
      if (command.name.length < 8) {
        helpOptions += `\t${command.name}\t\t${command.description}\n`;
      } else {
        helpOptions += `\t${command.name}\t${command.description}\n`;
      }
    });

    const template = fs.readFileSync(parameters.templates.help, 'utf-8');
    const appInfo = JSON.parse(fs.readFileSync('./package.json'));

    console.log(template, appInfo.version, appInfo.description, helpOptions.slice(0, -1));
  }

  listCommands() {
    return fs
      .readdirSync(commandsPath)
      .map(fileName => path.basename(fileName, '.js'))
  }
}

module.exports = HelpCommand;