'use strict';

const AbstractCommand = require('./abstract-command');

class ConfigCommand extends AbstractCommand {
  //todo: Introduce common logic for `ConfigCommands`:
  //  [ component, project, list, project, !configure, !convert ]
  constructor(parameters, logger) {
    super(parameters, logger);

  }
}

module.exports = ConfigCommand;
