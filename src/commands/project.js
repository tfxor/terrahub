'use strict';

const fs = require('fs');
const path = require('path');
const ConfigLoader = require('../config-loader');
const AbstractCommand = require('../abstract-command');
const { templates, config, fetch } = require('../parameters');
const { renderTwig, isAwsNameValid } = require('../helpers/util');

class ProjectCommand extends AbstractCommand {
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
  run() {
    const name = this.getOption('name');
    const code = this.getProjectCode(name);
    const directory = path.resolve(this.getOption('directory'));

    if (!isAwsNameValid(name)) {
      throw new Error('Name is not valid, only letters, numbers, hyphens, or underscores are allowed');
    }

    return this._isCodeValid(code).then(valid => {
      if (!valid) {
        throw new Error('Project code has collisions');
      }

      const format = config.format === 'yaml' ? 'yml' : config.format;
      const srcFile = path.join(templates.config, 'project', `.terrahub.${format}.twig`);
      const outFile = path.join(directory, config.defaultFileName);
      const isProjectExisting = ConfigLoader.availableFormats
        .some(it => fs.existsSync(path.join(directory, `.terrahub${it}`)));

      if (Object.keys(this.getProjectConfig()).length || isProjectExisting) {
        this.logger.warn(`Project already configured in ${directory} directory`);
        return Promise.resolve();
      }

      return renderTwig(srcFile, { name, code }, outFile).then(() => {
        return Promise.resolve('Project successfully initialized');
      });
    });
  }

  /**
   * Check project code for collisions
   * @param {String} code
   * @returns {Promise}
   * @private
   */
  _isCodeValid(code) {
    if (!config.token) {
      return Promise.resolve(true);
    }

    return fetch.get(`thub/project/validate?hash=${code}`)
      .then(json => json.data.isValid)
      .catch(err => {
        // @todo get rid of `errorMessage` in future
        throw new Error(err.message || err.errorMessage);
      });
  }
}

module.exports = ProjectCommand;
