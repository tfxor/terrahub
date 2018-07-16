#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const { exec } = require('child-process-promise');
const Logger = require('./../src/helpers/logger');
const HelpParser = require('../src/helpers/help-parser');
const { templates, packageJson } = require('../src/parameters');
const packageContent = require(packageJson);

/**
 * @return {Promise}
 */
function checkDiff() {
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
  return fs.remove('./node_modules').catch(() => {
    throw new Error('[Failed] cleaning up terrahub node_modules');
  });
}

/**
 * @return {Promise}
 */
function installNodeModules() {
  return exec('npm install --no-shrinkwrap --no-peer').then(result => {
    if (result.error) {
      throw '[Failed] installing terrahub dependencies';
    }

    return Promise.resolve();
  });
}

/**
 * @return {Promise}
 */
function npmVersion() {
  return exec(`npm version ${version}`).then(result => {
    if (result.error) {
      throw new Error(`[Failed] updating ${version} version of terrahub package`);
    }

    return Promise.resolve();
  });
}

/**
 * Updates help metadata and package.json with new version
 */
function updateHelpMetadata() {
  const commands = HelpParser.getCommandsInstanceList();

  const json = {
    name: packageContent.name,
    version: packageContent.version,
    description: packageContent.description,
    buildDate: packageContent.buildDate,
    commands: HelpParser.getCommandsDescription(commands)
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
      throw result.error;
    }

    return Promise.resolve();
  });
}

/**
 * @return {Promise}
 */
function commitChanges() {
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
const logger = new Logger();

checkDiff()
  .then(deleteNodeModules)
  .then(installNodeModules)
  .then(npmVersion)
  .then(updateHelpMetadata)
  .then(npmPublish)
  .then(commitChanges)
  .then(gitPush)
  .then(() => {
    logger.info('[Ok] Done');
  })
  .catch(err => {
    logger.error(err);
  });
