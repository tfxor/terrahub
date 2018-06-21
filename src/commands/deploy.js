'use strict';

const AbstractCommand = require('../abstract-command');

class DeployCommand extends AbstractCommand {
  static get name() {
    return null;
  }
}

module.exports = DeployCommand;
