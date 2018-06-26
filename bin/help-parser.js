'use strict';

const fs = require('fs');
const path = require('path');
const parameters = require('../src/parameters');

/**
 * @return {Array}
 */
function getCommandsNameList() {
  return fs.readdirSync(parameters.commandsPath).map(fileName => path.basename(fileName, '.js'));
}

/**
 * @param {Array} list
 * @return {Array}
 */
function getCommandsInstanceList(list) {
  const commands = [];
  list.forEach((commandName) => {
    const Command = require(path.join(parameters.commandsPath, commandName));

    const command = new Command(0);
    if (command.getDescription()) {
      commands.push(command);
    }
  });

  return commands;
}

/**
 * Writes commands' description in help.json
 */
const commandsNameList = getCommandsNameList();
const commands = getCommandsInstanceList(commandsNameList);

const json = [];

commands.forEach((command) => {
  let options = [];
  Object.keys(command._options).forEach(key => {
    const option = command._options[key];

    options.push(option);
  });

  let value = {
    name: command.getName(),
    description: command.getDescription(),
    options
  };

  value.options.forEach((option) => {
    if (option.defaultValue === process.cwd()) {
      option.defaultValue = 'Terrahub directory';
    }
  });

  json.push(value)
});

fs.writeFileSync(parameters.templates.helpMetadata, JSON.stringify(json, undefined, 2));