#!/usr/bin/env node

'use strict';

const path = require('path');
const semver = require('semver');
const { engines } = require('../package.json');
const logger = require('../src/helpers/logger');
const Parameters = require('../src/parameters');
const HelpCommand = require('../src/commands/.help');
const ApiHelper = require('../src/helpers/api-helper');
const HelpParser = require('../src/helpers/help-parser');
const AwsDistributor = require('../src/helpers/distributors/aws-distributor');
const LocalDistributor = require('../src/helpers/distributors/local-distributor');

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
  const command = Parameters.args._.shift();
  delete Parameters.args._;

  if (!HelpParser.getCommandsNameList().includes(command) || Parameters.config.isHelp
    || HelpParser.hasInvalidOptions(command, Parameters.args)) {
    Parameters.args.command = command;

    const helpCommand = new HelpCommand(Parameters, logger);

    return new LocalDistributor(helpCommand);
  }
  const Command = require(path.join(Parameters.commandsPath, command)); //todo Command gets parameters, then Distributor takes parameters form Command
  const _Command = new Command(Parameters, logger);

  return new LocalDistributor(_Command);
}

/**
 * @param {Number} code
 * @return {Promise}
 */
async function syncExitProcess(code) {
  await ApiHelper.promisesForSyncExit();
  await ApiHelper.sendLogToS3();
  await ApiHelper.deleteTempFolder();

  return process.exit(code);
}


let command;
try {
  command = commandCreate(logger);
} catch (error) {
  logger.error(error || 'Error occurred');
  process.exit(1);
}

// const environment = command.command.getOption('env') ? command.command.getOption('env') : 'default';
// const projectConfig = command.command.getProjectConfig();

(async () => {
  try {
    ApiHelper.init(Parameters);

    const result = await command.runCommand();
    const message = Array.isArray(result) ? result.toString() : result;

    if (message) {
      logger.info(message);
    }

    await syncExitProcess(0);
  } catch (err) {
    logger.error(err.message || err || 'Error occurred');

    await syncExitProcess(1);
  }
})();

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
