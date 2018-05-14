#!/usr/bin/env node

'use strict';

const semver = require('semver');
const { engines } = require('../package');
const CommandFactory = require('../src/command-factory');

if (!semver.satisfies(process.version, engines.node)) {
  console.log('Required Node version is %s, current %s', engines.node, process.version);
  process.exit(1);
}

const command = CommandFactory.create(process.argv);

command
  .validate()
  .then(() => command.run())
  .then(message => {
    console.log(message);
    process.exit(0);
  })
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
