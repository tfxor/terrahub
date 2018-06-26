'use strict';

const fs = require('fs');
const path = require('path');
// @todo: check if works correctly
const { commandsPath } = require("../parameters");
const { helpJSON } = require('../parameters');

/**
 * @return {Array}
 * */
function getCommandsNameList() {
  return fs
    .readdirSync(commandsPath)
    .map(fileName => path.basename(fileName, '.js'));

}

/**
 * @param {Array} list
 * @return {Array}
 * */
function getCommandsInstanceList(list) {
  const commands = [];
  list.forEach((commandName) => {
    const Command = require(path.join(commandsPath, commandName));

    const command = new Command(0);
    if (command.getDescription()) {
      commands.push(command);
    }
  });

  return commands;
}

/**
 * Main
 * */
const commandsNameList = getCommandsNameList();
const commands = getCommandsInstanceList(commandsNameList);

const json = [];

commands.forEach((command) => {
  let value = {
    name: command.getName(),
    description: command.getDescription(),
    options: Object.values(command._options)
  };

  value.options.forEach((option) => {
    if (option.defaultValue === process.cwd()) {
      option.defaultValue = 'Terrahub directory';
    }
  });

  json.push(value)
});

fs.writeFileSync(helpJSON, JSON.stringify(json, undefined, 2));