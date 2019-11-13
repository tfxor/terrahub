#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const { exec } = require('child-process-promise');
const logger = require('../src/helpers/logger');
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
  case 'patch':
    break;
  case 'minor':
    break;
  case 'major':
    break;
  case 'premajor':
    break;
  default:
    logger.error('Please, enter a valid argument');
    process.exit(1);
}

/**
 * @returns {Promise}
 */
async function gitDiff() {
  logger.info('Running git diff');
  const result = await exec(`git diff`);
  if (result.stdout || result.error) {
    throw new Error('You have unstaged changes, please, commit them before publishing');
  }

  return Promise.resolve();
}

/**
 * @returns {Promise}
 */
async function deleteNodeModules() {
  logger.info('Deleting node_modules');
  try {
    return fs.remove('./node_modules');
  } catch (error) {
    logger.warn(`[Warning] cleaning up node_modules failed - ${error.message}`);
  }
}

/**
 * @returns {Promise}
 */
async function installNodeModules() {
  logger.info('Running npm install');
  const result = await exec(`npm install --no-shrinkwrap --no-peer`);
  if (result.error) {
    throw new Error('[Failed] installing terrahub dependencies');
  }

  return Promise.resolve();
}

/**
 * @returns {Promise}
 */
async function npmVersion() {
  logger.info('Running npm version');
  const result = await exec(`npm version ${action}`);
  if (result.error) {
    throw new Error(`[Failed] updating version of terrahub package with ${action}`);
  }

  return Promise.resolve();
}

/**
 * Update metadata.json and package.json
 * @returns {Promise}
 */
async function updateJsonFiles() {
  logger.info('Updating json files');
  HelpParser.updateMetadata();
  await HelpParser.updateAWSRegions();

  return Promise.resolve('Done');
}

/**
 * @returns {Promise}
 */
async function npmPublish() {
  logger.info('Running npm publish');
  const result = await exec(`dev="alpha" && test="beta" && stage="rc" && master="latest"` +
    ` && npm publish --tag $(git branch | grep \\* | cut -d ' ' -f2)`);
  if (result.error) {
    throw result.error;
  }

  return Promise.resolve();
}

/**
 * @returns {Promise}
 */
async function gitCommit() {
  logger.info('Running git commit');
  const result = await exec(`git add . && git commit -a -m "Publish terrahub help metadata"`);
  if (result.error) {
    throw new Error('[Failed] to commit');
  }

  return Promise.resolve();
}

/**
 * @returns {Promise}
 */
async function gitPush() {
  logger.info('Running git push');
  const result = await exec(`git push`);
  if (result.error) {
    throw result.error;
  }

  return Promise.resolve();
}

/**
 * Save application information and commands' description in metadata.json
 * Set the new version of the application
 */
(async () => {
  try {
    await gitDiff();
    await deleteNodeModules();
    await installNodeModules();
    await npmVersion();
    await updateJsonFiles();
    await npmPublish();
    await gitCommit();
    await gitPush();
    logger.info('Done');
    process.exit(0);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
})();
