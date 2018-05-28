#!/usr/bin/env node

'use strict';

const semver = require('semver');
const logger = require('../src/helpers/logger');
const { engines } = require('../package');
const CommandFactory = require('../src/command-factory');

if (!semver.satisfies(process.version, engines.node)) {
  logger.info('Required Node version is %s, current %s', engines.node, process.version);
  process.exit(1);
}

const command = CommandFactory.create(process.argv);

command
  .validate()
  .then(() => command.run())
  .then(message => {
    if (message) {
      logger.log(message);
    }
    process.exit(0);
  })
  .catch(err => {
    logger.error(err.message ? err.message : 'Error occurred');
    process.exit(1);
  });
