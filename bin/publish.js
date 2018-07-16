#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const { exec } = require('child-process-promise');
const Logger = require('./../src/helpers/logger');
const HelpParser = require('../src/helpers/help-parser');
const { templates, packageJson } = require('../src/parameters');
const packageContent = require(packageJson);

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
 * @return {Promise}
 */
function gitDiff() {
  return exec('git diff').then(result => {
    if (result.stdout) {
      throw new Error('You have unstaged changes, please, commit them before publishing');
    }

    return Promise.resolve();
  });
}

/**
 * @return {Promise}
 */
function deleteNodeModules() {
  return fs.remove('./node_modules').catch(result => {
    Logger.warn('[Warning] cleaning up node_modules failed - ', result);
  });
}

/**
 * @return {Promise}
 */
function installNodeModules() {
  return exec('npm install --no-shrinkwrap --no-peer').then(result => {
    if (result.error) {
      throw new Error('[Failed] installing terrahub dependencies');
    }

    return Promise.resolve();
  });
}

/**
 * @return {Promise}
 */
function npmVersion() {
  return exec(`npm version ${action}`).then(result => {
    if (result.error) {
      throw new Error(`[Failed] updating ${action} version of terrahub package`);
    }

    return Promise.resolve();
  });
}

/**
 * Updates metadata.json and package.json
 */
function updateJsonFiles() {
  const commands = HelpParser.getCommandsInstanceList();

  const json = {
    name: packageContent.name,
    version: packageContent.version,
    description: packageContent.description,
    buildDate: (new Date).toUTCString(),
    commands: HelpParser.getCommandsDescriptionList(commands)
  };

  fs.writeJsonSync(templates.helpMetadata, json);

  return Promise.resolve();
}

/**
 * return {Promise}
 */
function npmPublish() {
  return exec('npm publish').then(result => {
    if (result.error) {
      throw new Error(result.error);
    }

    return Promise.resolve();
  });
}

/**
 * @return {Promise}
 */
function gitCommit() {
  return exec('git add . && git commit -a -m "Publish terrahub help metadata"').then(result => {
    if (result.error) {
      throw new Error('[Failed] to commit');
    }

    return Promise.resolve();
  });
}

/**
 * @return {Promise}
 */
function gitPush() {
  return exec('git push').then(result => {
    if (result.error) {
      throw result.error;
    }

    return Promise.resolve();
  });
}

/**
 * Saves application information and commands' description in metadata.json
 * Sets the new version of the application
 */
gitDiff()
  .then(deleteNodeModules)
  .then(installNodeModules)
  .then(npmVersion)
  .then(updateJsonFiles)
  //.then(npmPublish)
  //.then(gitCommit)
  //.then(gitPush)
  .then(() => {
    Logger.info('[Ok] Done');
  })
  .catch(err => {
    Logger.error(err);
    process.exit(1);
  });
