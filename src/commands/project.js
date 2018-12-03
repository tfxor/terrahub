'use strict';

const fs = require('fs');
const path = require('path');
const ConfigLoader = require('../config-loader');
const AbstractCommand = require('../abstract-command');
const { templates, config, fetch } = require('../parameters');
const { renderTwig, toMd5, isAwsNameValid } = require('../helpers/util');

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
    const directory = path.resolve(this.getOption('directory'));
    const code = this._code(name);

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

    return fetch.get(`thub/hash/validate?projectHash=${code}`)
      .then(json => json.data.isValid)
      .catch(err => {
        // @todo get rid of `errorMessage` in future
        throw new Error(err.message || err.errorMessage);
      });
  }

  /**
   * Generate project code
   * @param {String} name
   * @returns {String}
   * @private
   */
  _code(name) {
    return toMd5(name + Date.now().toString()).slice(0, 8);
  }
}

module.exports = ProjectCommand;
