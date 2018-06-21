'use strict';

const TerraformCommand = require('../terraform-command');

class ShowCommand extends TerraformCommand {
  static get name() {
    return null;
  }
}

module.exports = ShowCommand;
