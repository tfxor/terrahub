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
const { deleteTempFolder } = require('../src/helpers/util');
const Distributor = require('../src/helpers/distributors/distributor');

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
 * @returns {Distributor}
 */
function commandCreate(logger = console) {
  const command = parameters.args._.shift();
  delete parameters.args._;

  if (!HelpParser.getCommandsNameList().includes(command) || parameters.config.isHelp
    || HelpParser.hasInvalidOptions(command, parameters.args)) {
    parameters.args.command = command;

    const helpCommand = new HelpCommand(parameters, logger);

    return new Distributor(helpCommand);
  }
  const Command = require(path.join(parameters.commandsPath, command));
  const _Command = new Command(parameters, logger);

  return new Distributor(_Command);
}

/**
 * @param {Number} code
 * @param {String | Array} message
 * @param {Boolean} error
 * @return {Promise}
 */
async function syncExitProcess(code, message, error = false) {
  await ApiHelper.promisesForSyncExit();
  deleteTempFolder();

  if (error) {
    Array.isArray(message)
      ? message.forEach(err => logger.error(err || 'Error occurred'))
      : logger.error(message || 'Error occurred');
  } else {
    message ? logger.info(message) : null;
  }

  await ApiHelper.saveRealtimeAndLogs();

  if (code !== 0) {
    return process.exit(code);
  }

  return Promise.resolve();
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

    await syncExitProcess(0, message);
  } catch (error) {
    ApiHelper.sendErrorToApi();

    await syncExitProcess(1, error, true);
  }
})();
