'use strict';

const AbstractCommand = require('./abstract-command');

class ConfigCommand extends AbstractCommand {

  // ConfigCommands list:
  // configure, command,
  // convert, graph,
  // list(uses AWS.creds),
  // project,
  constructor(input, logger) {
    super(input, logger);


  }
}

module.exports = ConfigCommand;
