const parameters = require('../src/parameters');
const HelpParser = require("../src/helpers/HelpParser");
const fs = require('fs');

/**
 * Saves application information and commands' description in metadata.json
 */

const date = new Date();

const packageContent = require(parameters.packageJson);

const commandsNameList = HelpParser.getCommandsNameList();
const commands = HelpParser.getCommandsInstanceList(commandsNameList);

const json = {
  name: packageContent.name,
  version: packageContent.version,
  description: packageContent.description,
  buildDate: date.toUTCString(),
  commands: HelpParser.getCommandsDescription(commands)
};

fs.writeFileSync(parameters.templates.helpMetadata, JSON.stringify(json, undefined, 2));
