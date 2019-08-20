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

    return HelpParser.getDistributor(false, helpCommand);
  }
  const Command = require(path.join(parameters.commandsPath, command));
  const _Command = new Command(parameters, logger);

  return HelpParser.getDistributor(parameters.args, _Command);
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

(async () => {
  try {
    ApiHelper.init(parameters);

    const result = await command.run();
    const message = Array.isArray(result) ? result.toString() : result;

    if (message) {
      logger.info(message);
    }

    await syncExitProcess(0);
  } catch (err) {
    console.log('cathed error in CLI.JS');
    ApiHelper.sendErrorToApi();
    logger.error(err.message || err || 'Error occurred');

    await syncExitProcess(1);
  }
})();
