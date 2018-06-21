'use strict';

const AbstractCommand = require('../abstract-command');

class BuildCommand extends AbstractCommand {
  static get name() {
    return null;
  }
}

module.exports = BuildCommand;
