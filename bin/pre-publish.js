#!/usr/bin/env node

'use strict';

const fs = require('fs');
const HelpParser = require('../src/helpers/help-parser');
const { templates, packageJson } = require('../src/parameters');

/**
 * Saves application information and commands' description in metadata.json
 */
const packageContent = require(packageJson);
const commands = HelpParser.getCommandsInstanceList();

const json = {
  name: packageContent.name,
  version: packageContent.version,
  description: packageContent.description,
  buildDate: packageContent.buildDate,
  commands: HelpParser.getCommandsDescription(commands)
};

fs.writeFileSync(templates.helpMetadata, JSON.stringify(json, null, 2));
