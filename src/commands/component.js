'use strict';

const AbstractCommand = require('../abstract-command');

class ComponentCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('component')
      // .setDescription('include existing terraform folder into current project')
      // .addOption('name', 'n', 'Component name', String)
      // .addOption('directory', 'd', 'Path to existing component (default: cwd)', String, process.cwd())
    ;
  }
}

module.exports = ComponentCommand;
