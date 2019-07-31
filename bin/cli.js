#!/usr/bin/env node

'use strict';

const path = require('path');
const semver = require('semver');
const { engines } = require('../package.json');
const logger = require('../src/helpers/logger');
const HelpCommand = require('../src/commands/.help');
const ApiHelper = require('../src/helpers/api-helper');
const HelpParser = require('../src/helpers/help-parser');
const { commandsPath, config, fetch, args } = require('../src/parameters');
const AwsDistributor = require('../src/helpers/distributors/aws-distributor');

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
  const _Command = new Command(args, logger);
  return new AwsDistributor(_Command, config, fetch);
}

/**
 * @param {Number} code
 * @return {Promise}
 */
function syncExitProcess(code) {
  return ApiHelper.promisesForSyncExit()
    .then(() => ApiHelper.sendLogToS3())
    .then(() => ApiHelper.deleteTempFolder())
    .then(() => process.exit(code));
}


let command;
try {
  command = commandCreate(logger);
} catch (error) {
  logger.error(error || 'Error occurred');
  process.exit(1);
}

const environment = command.command.getOption('env') ? command.command.getOption('env') : 'default';
const projectConfig = command.command.getProjectConfig();

try {
  command.runCommand().then(msg => {
    const message = Array.isArray(msg) ? msg.toString() : msg;
    if (message) {
      logger.info(message);
    }

    return syncExitProcess(0);
  });
} catch (error) {
  console.error(error);
  return syncExitProcess(1);
}

// command.command
//   .validate()
//   .then(() => {
//     ApiHelper.setToken(command.command._tokenIsValid);
//
//     return ApiHelper.sendMainWorkflow({
//         status: 'create',
//         runId: command.command.runId,
//         commandName: command.command._name,
//         project: projectConfig,
//         environment: environment,
//       })
//     }
//   )
//   .then(() => {
//     debugger;
//   return command.runActions()})
//   .then(() => {
//     debugger;
//     return command.command.run()})
//   .then(message => {
//     ApiHelper.sendMainWorkflow({ status: 'update' });
//
//     return Promise.resolve(message);
//   })
//   .then(msg => {
//     const message = Array.isArray(msg) ? msg.toString() : msg;
//     if (message) {
//       logger.info(message);
//     }
//
//     return syncExitProcess(0);
//   })
//   .catch(err => {
//     ApiHelper.sendErrorToApi();
//     logger.error(err.message || err || 'Error occurred');
//
//     return syncExitProcess(1);
//   });
