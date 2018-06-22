#!/usr/bin/env node

'use strict';

const semver = require('semver');
const logger = require('../src/helpers/logger');
const { engines } = require('../package');
const CommandFactory = require('../src/command-factory');

if (!semver.satisfies(process.version, engines.node)) {
  logger.warn(`Required Node version is ${engines.node}, current ${process.version}`);
  process.exit(1);
}

const command = CommandFactory.create(process.argv, logger);

command
  .checkHelp()
  .then(() => command.validate(),
    () => process.exit(0))
  .then(() => command.run())
  .then(message => {
    if (message) {
      logger.info(message);
    }
    process.exit(0);
  })
  .catch(err => {
    logger.error(err || 'Error occurred');
    process.exit(1);
  });
