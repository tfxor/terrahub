#!/usr/bin/env node

'use strict';

const path = require('path');
const semver = require('semver');
const { engines } = require('../package');
const logger = require('../src/helpers/logger');
const HelpCommand = require('../src/commands/.help');
const ApiHelper = require('../src/helpers/api-helper');
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
  return Promise.all(ApiHelper.promises)
    .then(() => ApiHelper.sendLogToS3())
    .then(() => process.exit(code));
}

let command;
try {
  command = commandCreate(logger);
} catch (error) {
  logger.error(error || 'Error occurred');
  process.exit(1);
}

const environment = command.getOption('env') ? command.getOption('env') : 'default';
const projectConfig = command.getProjectConfig();

command
  .validate()
  .then(() => ApiHelper.sendMainWorkflow({
      status: 'create',
      runId: command.runId,
      commandName: command._name,
      project: projectConfig,
      environment: environment
    })
  )
  .then(() => command.run())
  .then(message => {
    ApiHelper.sendMainWorkflow({ status: 'update' });

    return Promise.resolve(message);
  })
  .then(msg => {
    const message = Array.isArray(msg) ? msg.toString() : msg;
    if (message) {
      logger.info(message);
    }

    return syncExitProcess(0);
  })
  .catch(err => {
    ApiHelper.sendErrorToApi();
    logger.error(err || 'Error occurred');
    return syncExitProcess(1);
  });
