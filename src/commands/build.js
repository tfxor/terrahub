'use strict';

const AbstractCommand = require('../abstract-command');

class BuildCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'build';
  }

  static get description() {
    return 'build software from predefined build.yml config files';
  }
}

module.exports = BuildCommand;
