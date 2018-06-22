'use strict';

const AbstractCommand = require('../abstract-command');

class DeployCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'deploy';
  }

  static get description() {
    return 'deploy software from predefined deploy.yml config files';
  }
}

module.exports = DeployCommand;
