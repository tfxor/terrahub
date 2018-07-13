#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const HelpParser = require('../src/helpers/help-parser');
const { templates, packageJson } = require('../src/parameters');
const { exec } = require('child-process-promise');
const semver = require('semver');

/**
 * @return {Promise}
 */
function checkDiff() {
  return exec('git diff')
    .then(result => {
      if (result.stdout) {
        throw new Error('You have unstaged changes, please, commit them before publishing');
      }

      return Promise.resolve(result.stdout !== null);
    });
}

/**
 * Updates help metadata and package.json with new version
 */
function updateHelpMetadataAndPackageJson() {
  const commands = HelpParser.getCommandsInstanceList();
  packageContent.version = version;

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
 * @return {Promise}
 */
function commitChanges() {
  return exec('git add . && git commit -a -m "Publish terrahub help metadata"')
    .then(result => {
      if (result.error) {
        throw new Error('[Failed] to commit');
      }

      return Promise.resolve();
    });
}

/**
 * @return {Promise}
 */
function deleteNodeModules() {
  return exec('rm -rf node_modules')
    .then(result => {
      if (result.error) {
        throw new Error('[Failed] cleaning up terrahub node_modules');
      }

      return Promise.resolve();
    });
}

/**
 * @return {Promise}
 */
function installNodeModules() {
  return exec('npm install --no-shrinkwrap --no-peer')
    .then(result => {
      if (result.error) {
        throw '[Failed] installing terrahub dependencies';
      }

      return Promise.resolve();
    });
}

function npmVersion() {
  return exec(`npm version ${version}`)
    .then(result => {
      if (result.error) {
        throw new Error(`[Failed] updating ${version} version of terrahub package`);
      }

      return Promise.resolve();
    });
}

/**
 * @return {Promise}
 */
function gitPush() {
  return exec('git push') // @todo: discuss where to push
    .then(result => {
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
if (process.argv.slice(2).length !== 1) {
  console.error('Please, enter new version as argument');
  process.exit(1);
}

const version = process.argv[2];

const packageContent = require(packageJson);

if (!(semver.valid(version) && semver.gt(version, packageContent.version))) {
  console.error('New version must be in specified format and be greater than the current one.');
  process.exit(1);
}

checkDiff()
  .then(updateHelpMetadataAndPackageJson)
  .then(commitChanges)
  .then(deleteNodeModules)
  .then(installNodeModules)
  .then(npmVersion)
  .then(gitPush)
  .then(() => {
    console.log('[Ok] Done');
  })
  .catch(err => {
    console.error(err);
  });
