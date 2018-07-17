#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const { exec } = require('child-process-promise');
const Logger = require('./../src/helpers/logger');
const HelpParser = require('../src/helpers/help-parser');
const { templates, packageJson } = require('../src/parameters');

/**
 * Argument validation
 */
if (process.argv.slice(2).length !== 1) {
  Logger.error('Please, enter only one argument');
  process.exit(1);
}

const action = process.argv[2];

switch (action) {
  case 'patch': break;
  case 'minor': break;
  case 'major': break;
  case 'premajor': break;
  default:
    Logger.error('Please, enter a valid argument');
    process.exit(1);
}

/**
 * @returns {Promise}
 */
function gitDiff() {
  Logger.info('Running git diff');
  return exec('git diff').then(result => {
    if (result.stdout || result.error) {
      throw new Error('You have unstaged changes, please, commit them before publishing');
    }

    return Promise.resolve();
  });
}

/**
 * @returns {Promise}
 */
function deleteNodeModules() {
  Logger.info('Deleting node_modules');
  return fs.remove('./node_modules').catch(error => {
    Logger.warn(`[Warning] cleaning up node_modules failed - ${error.message}`);
  });
}

/**
 * @returns {Promise}
 */
function installNodeModules() {
  Logger.info('Running npm install');
  return exec('npm install --no-shrinkwrap --no-peer').then(result => {
    if (result.error) {
      throw new Error('[Failed] installing terrahub dependencies');
    }

    return Promise.resolve();
  });
}

/**
 * @returns {Promise}
 */
function npmVersion() {
  Logger.info('Running npm version');
  return exec(`npm version ${action}`).then(result => {
    if (result.error) {
      throw new Error(`[Failed] updating version of terrahub package with ${action}`);
    }

    return Promise.resolve();
  });
}

/**
 * Update metadata.json and package.json
 * @returns {Promise}
 */
function updateJsonFiles() {
  Logger.info('Updating json files');
  const packageContent = require(packageJson);
  const commands = HelpParser.getCommandsInstanceList();

  const json = {
    name: packageContent.name,
    version: packageContent.version,
    description: packageContent.description,
    buildDate: (new Date).toISOString(),
    commands: HelpParser.getCommandsDescriptionList(commands)
  };

  fs.writeJsonSync(templates.helpMetadata, json);

  return Promise.resolve();
}

/**
 * @returns {Promise}
 */
function npmPublish() {
  Logger.info('Running npm publish');
  return exec('npm publish').then(result => {
    if (result.error) {
      throw result.error;
    }

    return Promise.resolve();
  });
}

/**
 * @returns {Promise}
 */
function gitCommit() {
  Logger.info('Running git commit');
  return exec('git add . && git commit -a -m "Publish terrahub help metadata"').then(result => {
    if (result.error) {
      throw new Error('[Failed] to commit');
    }

    return Promise.resolve();
  });
}

/**
 * @returns {Promise}
 */
function gitPush() {
  Logger.info('Running git push');
  return exec('git push').then(result => {
    if (result.error) {
      throw result.error;
    }

    return Promise.resolve();
  });
}

/**
 * Save application information and commands' description in metadata.json
 * Set the new version of the application
 */
gitDiff()
  .then(deleteNodeModules)
  .then(installNodeModules)
  .then(npmVersion)
  .then(updateJsonFiles)
  .then(npmPublish)
  .then(gitCommit)
  .then(gitPush)
  .then(() => {
    Logger.info('Done');
    process.exit(0);
  })
  .catch(error => {
    Logger.error(error);
    process.exit(1);
  });
