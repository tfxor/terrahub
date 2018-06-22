'use strict';

const AbstractCommand = require('../abstract-command');

class DeployCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('deploy')
  //     .setDescription('deploy software from predefined deploy.yml config files')
  }
}

module.exports = DeployCommand;
