'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const AbstractCommand = require('../abstract-command');
const { templates, config } = require('../parameters');
const { renderTwig, isAwsNameValid } = require('../helpers/util');

class ComponentCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('component')
      .setDescription('include existing terraform folder into current project')
      .addOption('name', 'n', 'Component name', String)
      .addOption('parent', 'p', 'Parent component path', String, '')
      .addOption('directory', 'd', 'Path to existing component (default: cwd)', String, process.cwd())
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const name = this.getOption('name');
    const parent = this.getOption('parent');
    const directory = path.resolve(this.getOption('directory'));

    if (!isAwsNameValid(name)) {
      throw new Error('Name is not valid, only letters, numbers, hyphens, or underscores are allowed');
    }

    const srcFile = path.join(templates.configs, 'component', `.terrahub.${config.format}.twig`);
    const outFile = path.join(directory, config.fileName);

    if (!fse.pathExistsSync(directory)) {
      throw new Error('Can not create because path is invalid');
    }

    if (fs.existsSync(outFile)) {
      throw new Error('Can not create because terraform component already exists');
    }

    return renderTwig(srcFile, { name: name, parent: parent }, outFile);
  }
}

module.exports = ComponentCommand;
