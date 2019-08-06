'use strict';

const fs = require('fs');
const path = require('path');
const ConfigLoader = require('../config-loader');
const ConfigCommand = require('../config-command');
const { renderTwig, isAwsNameValid } = require('../helpers/util');

class ProjectCommand extends ConfigCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('project')
      .setDescription('create new or define existing folder as project that manages terraform configuration')
      .addOption('name', 'n', 'Project name', String)
      .addOption('directory', 'd', 'Path where project should be created (default: cwd)', String, process.cwd())
    ;
  }

  /**
   * @returns {Promise}
   */
  async run() {
    const name = this.getOption('name');
    const code = this.getProjectCode(name);
    const directory = path.resolve(this.getOption('directory'));

    debugger;

    if (!isAwsNameValid(name)) {
      throw new Error('Name is not valid, only letters, numbers, hyphens, or underscores are allowed');
    }

    const isValid = await this._isCodeValid(code);

    if (!isValid) {
      throw new Error('Project code has collisions');
    }

    debugger;

    const format = this.terrahubCfg.format === 'yaml' ? 'yml' : this.terrahubCfg.format;
    const srcFile = path.join(this.parameters.templates.config, 'project', `.terrahub.${format}.twig`);
    const outFile = path.join(directory, this.terrahubCfg.defaultFileName);
    const isProjectExisting = ConfigLoader.availableFormats
      .some(it => fs.existsSync(path.join(directory, `.terrahub${it}`)));

    debugger;

    if (Object.keys(this.getProjectConfig()).length || isProjectExisting) {
      this.logger.warn(`Project already configured in ${directory} directory`);
      return Promise.resolve();
    }

    return renderTwig(srcFile, { name, code }, outFile).then(() => {
      return Promise.resolve('Project successfully initialized');
    });
  }

  /**
   * Check project code for collisions
   * @param {String} code
   * @returns {Promise}
   * @private
   */
  async _isCodeValid(code) {
    debugger;

    if (!this.terrahubCfg.token) {
      return Promise.resolve(true);
    }

    try {
      const json = await this.fetch.get(`thub/project/validate?hash=${code}`);

      return json.data.isValid;
    } catch (err) {
      throw new Error(err.message || err.errorMessage);
    }
  }
}

module.exports = ProjectCommand;
