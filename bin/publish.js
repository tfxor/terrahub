#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const logger = require('./../src/helpers/logger');
const { exec } = require('child-process-promise');
const HelpParser = require('../src/helpers/help-parser');

/**
 * Argument validation
 */
if (process.argv.slice(2).length !== 1) {
  logger.error('Please, enter only one argument');
  process.exit(1);
}

const action = process.argv[2];

switch (action) {
  case 'patch': break;
  case 'minor': break;
  case 'major': break;
  case 'premajor': break;
  default:
    logger.error('Please, enter a valid argument');
    process.exit(1);
}

/**
 * @returns {Promise}
 */
function gitDiff() {
  logger.info('Running git diff');
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
  logger.info('Deleting node_modules');
  return fs.remove('./node_modules').catch(error => {
    logger.warn(`[Warning] cleaning up node_modules failed - ${error.message}`);
  });
}

/**
 * @returns {Promise}
 */
function installNodeModules() {
  logger.info('Running npm install');
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
  logger.info('Running npm version');
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
  logger.info('Updating json files');
  HelpParser.updateMetadata();

  return Promise.resolve('Done');
}

/**
 * @returns {Promise}
 */
function npmPublish() {
  logger.info('Running npm publish');
  return exec('MAP=(["dev"]="alpha" ["test"]="beta" ["stage"]="rc" ["master"]="latest") && BRANCH="$(git branch | grep \* | cut -d \" \" -f2)" && npm publish --tag ${MAP[$BRANCH]}').then(result => {
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
  logger.info('Running git commit');
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
  logger.info('Running git push');
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
    logger.info('Done');
    process.exit(0);
  })
  .catch(error => {
    logger.error(error);
    process.exit(1);
  });
