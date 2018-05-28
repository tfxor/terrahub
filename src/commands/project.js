'use strict';

const path = require('path');
const { renderTwig } = require('../helpers/util');
const AbstractCommand = require('../abstract-command');

class ProjectCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('project')
      .setDescription('Project configuration')
      .addOption('name', 'n', 'Project name', String)
      .addOption('provider', 'p', 'Project provider', String, 'aws')
      .addOption('directory', 'd', 'Path where project should be created (default: cwd)', String, process.cwd())
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const twigReg = /\.twig$/;
    const name = this.getOption('name');
    const provider = this.getOption('provider');
    const directory = path.resolve(this.getOption('directory'), name);
    const srcFile = path.join(__dirname, '../templates/configs/project', '.terrahub.yml.twig');
    const outFile = path.join(directory, path.basename(srcFile).replace(twigReg, ''));

    return renderTwig(srcFile, { name, provider }, outFile).then(() => Promise.resolve('Done'));
  }
}

module.exports = ProjectCommand;
