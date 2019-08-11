#!/usr/bin/env node

'use strict';

const path = require('path');
const semver = require('semver');
const { engines } = require('../package.json');
const logger = require('../src/helpers/logger');
const parameters = require('../src/parameters');
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
  const command = parameters.args._.shift();
  delete parameters.args._;

  if (!HelpParser.getCommandsNameList().includes(command) || parameters.config.isHelp
    || HelpParser.hasInvalidOptions(command, parameters.args)) {
    parameters.args.command = command;

    const helpCommand = new HelpCommand(parameters, logger);

    return new LocalDistributor(helpCommand);
  }
  const Command = require(path.join(parameters.commandsPath, command));
  const _Command = new Command(parameters, logger);

  // return new LocalDistributor(_Command); //todo DistributorDispatcher (Local/AWS/Azure)
  return parameters.args.cloud ? new AwsDistributor(_Command) : new LocalDistributor(_Command); //todo DistributorDispatcher (Local/AWS/Azure)
}

/**
 * @param {Number} code
 * @return {Promise}
 */
async function syncExitProcess(code) {
  await ApiHelper.promisesForSyncExit();
  await ApiHelper.sendLogToS3();
  // await ApiHelper.deleteTempFolder();

  return process.exit(code);
}


let command;
try {
  command = commandCreate(logger);
} catch (error) {
  logger.error(error || 'Error occurred');
  process.exit(1);
}

(async () => {
  try {
    ApiHelper.init(parameters);

    const result = await command.runCommand();
    const message = Array.isArray(result) ? result.toString() : result;

    if (message) {
      logger.info(message);
    }

    await syncExitProcess(0);
  } catch (err) {
    ApiHelper.sendErrorToApi();
    logger.error(err.message || err || 'Error occurred');

    await syncExitProcess(1);
  }
})();
