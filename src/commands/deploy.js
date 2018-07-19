'use strict';

const AbstractCommand = require('../abstract-command');

class DeployCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('deploy')
      .setDescription('deploy software from predefined deploy.yml config files [Not Implemented Yet]')
    ;
  }
}

module.exports = DeployCommand;
