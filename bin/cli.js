#!/usr/bin/env node

'use strict';

const path = require('path');
const semver = require('semver');
const { engines } = require('../package');
const logger = require('../src/helpers/logger');
const HelpCommand = require('../src/commands/.help');
const HelpParser = require('../src/helpers/help-parser');
const { commandsPath, config, args } = require('../src/parameters');

/**
 * Validate node version
 */
if (!semver.satisfies(process.version, engines.node)) {
  logger.warn(`Required Node version is ${engines.node}, current ${process.version}`);
  process.exit(1);
}

/**
 * Command create
 * @param {logger|*} logger
 * @returns {*}
 */
function commandCreate(logger = console) {
  const command = args._.shift();
  delete args._;

  if (!HelpParser.getCommandsNameList().includes(command) || config.isHelp
    || HelpParser.hasInvalidOptions(command, args)) {
    args.command = command;
    return new HelpCommand(args, logger);
  }

  const Command = require(path.join(commandsPath, command));
  return new Command(args, logger);
}

/**
 * @param {Number} code
 * @return {Promise}
 */
function syncExitProcess(code) {
  return Promise.all(logger.promises).then(() => process.exit(code));
}

let command;
try {
  command = commandCreate(logger);
} catch (error) {
  logger.error(error || 'Error occurred');
  process.exit(1);
}

command
  .validate()
  .then(() => logger.sendWorkflowToApi(
    { status: 'create', target: 'workflow', action: command._name }))
  .then(() => command.run())
  .then(message => logger.sendWorkflowToApi(
    { status: 'update', target: 'workflow', action: command._name }, message))
  .then(message => logger.sendWorkflowToApi({ target: 's3' }, message))
  .then(msg => {
    const message = Array.isArray(msg) ? msg.toString() : msg;
    if (message) {
      logger.info(message);
    }

    return syncExitProcess(0);
  })
  .catch(err => {
    logger.sendWorkflowToApi({ target: 's3' });
    logger.error(err || 'Error occurred');

    return syncExitProcess(1);
  });
