'use strict';

const path = require('path');
const { renderTwig } = require('../helpers/util');
const AbstractCommand = require('../abstract-command');
const { templates, config } = require('../parameters');

class ProjectCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('project')
      .setDescription('Create or update project that manages multiple terraform scripts')
      .addOption('name', 'n', 'Project name', String)
      .addOption('provider', 'p', 'Project provider', String, 'aws')
      .addOption('directory', 'd', 'Path where project should be created (default: cwd)', String, process.cwd())
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const name = this.getOption('name');
    const provider = this.getOption('provider');
    const directory = path.resolve(this.getOption('directory'), name);
    const srcFile = path.join(templates.configs, `project/.terrahub.${config.format}.twig`);
    const outFile = path.join(directory, `.terrahub.${config.format}`);

    return renderTwig(srcFile, { name, provider }, outFile).then(() => {
      return Promise.resolve(`Project successfully initialized (cd ${directory})`);
    });
  }
}

module.exports = ProjectCommand;
