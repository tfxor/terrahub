'use strict';

const AbstractCommand = require('./abstract-command');

class ConfigCommand extends AbstractCommand {
  //todo: Introduce common logic for `ConfigCommands`:
  //  [ component, project, list, project, !configure, !convert ]

  // eslint-disable-next-line no-useless-constructor
  constructor(parameters, logger) {
    super(parameters, logger);

  }
}

module.exports = ConfigCommand;
