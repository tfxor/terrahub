#!/usr/bin/env node

'use strict';

const fs = require('fs');
const parameters = require('../src/parameters');
const HelpParser = require('../src/helpers/help-parser');

/**
 * Saves application information and commands' description in metadata.json
 */
const packageContent = require(parameters.packageJson);

const commandsNameList = HelpParser.getCommandsNameList();
const commands = HelpParser.getCommandsInstanceList(commandsNameList);

const json = {
  name: packageContent.name,
  version: packageContent.version,
  description: packageContent.description,
  buildDate: packageContent.buildDate,
  commands: HelpParser.getCommandsDescription(commands)
};

fs.writeFileSync(parameters.templates.helpMetadata, JSON.stringify(json, null, 2));
