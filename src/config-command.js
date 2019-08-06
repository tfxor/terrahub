'use strict';

const AbstractCommand = require('./abstract-command');

class ConfigCommand extends AbstractCommand {

  // ConfigCommands list:
  // configure, command,
  // convert, graph,
  // list(uses AWS.creds),
  // project,
  constructor(parameters, logger) {
    super(parameters, logger);

  }
}

module.exports = ConfigCommand;
