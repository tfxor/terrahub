'use strict';

const AbstractCommand = require('../abstract-command');

class BuildCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('build')
    // .setDescription('build software from predefined build.yml config files')
    ;
  }
}

module.exports = BuildCommand;
