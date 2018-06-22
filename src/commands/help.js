'use strict';

const fs = require('fs');
const path = require('path');
const parameters = require('../parameters');
const AbstractCommand = require('../abstract-command');

class HelpCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'help';
  }

  static get description() {
    return 'Options available without a command entered';
  }

  static get options() {
    return super.options
      .addOption('help', 'h', 'Show list of available commands', Boolean, false)
      .addOption('version', 'v', 'Show current version of the application', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  run() {
    const help = this.getOption('help');
    const version = this.getOption('version');

    if (help) {
      this.showHelp();
    } else if (version) {
      this.showVersion();
    } else {
      this.logger.error('Command missing or NOT supported yet');
    }

    return Promise.resolve();
  }

  showVersion() {
    const appInfo = JSON.parse(fs.readFileSync('./package.json'));

    console.log(`v${appInfo.version}`);

    return Promise.resolve();
  }

  showHelp() {
    const commandNamesList = this.listCommands();

    const Commands = [];
    commandNamesList.forEach((commandName) => {
      const Command = require(path.join(HelpCommand.commandsPath, commandName));
      if (Command.name && Command.name !== 'help') {
        Commands.push(Command);
      }
    });

    // @todo: move this code block into template file
    let helpOptions = '';
    Commands.forEach((Command) => {
      helpOptions += `\t${Command.name}\t\t${Command.description}\n`;

      const options = Object.values(Command.options);

      if (options.length !== 0) {
        helpOptions += '\tOptions:\n';
        options.forEach((option) => {
          if (option.name.length < 6) {
            helpOptions += `\t--${option.name}\t\t-${option.shortcut}\t${option.description}\n`;
          } else {
            helpOptions += `\t--${option.name}\t-${option.shortcut}\t${option.description}\n`;
          }
        });
      }
      helpOptions += '\n';
    });

    const template = fs.readFileSync(parameters.templates.help, 'utf-8');
    const appInfo = JSON.parse(fs.readFileSync('./package.json'));

    console.log(template, appInfo.version, appInfo.description, helpOptions.slice(0, -1));
  }

  listCommands() {
    return fs
      .readdirSync(HelpCommand.commandsPath)
      .map(fileName => path.basename(fileName, '.js'))
  }

  static get commandsPath() {
    return __dirname;
  }
}

module.exports = HelpCommand;
