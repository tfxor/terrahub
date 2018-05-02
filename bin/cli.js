#!/usr/bin/env node

'use strict';

const semver = require('semver');
const { engines } = require('../package');

if (!semver.satisfies(process.version, engines.node)) {
  console.log('Required Node version is %s, current %s', engines.node, process.version);
  process.exit(1);
}

const CommandFactory = require('../src/command-factory');

CommandFactory.create(process.argv);
