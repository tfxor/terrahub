'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const Twig = require('twig');
const AbstractCommand = require('../abstract-command');

class CreateCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('create')
      .setDescription('Create terraform code from predefined templates')
      .addOption('name', 'n', 'Uniquely identifiable cloud resource name')
      .addOption('template', 't', 'Template name (e.g. cloudfront, dynamodb, lambda, s3)')
      .addOption('directory', 'd', 'Path where template should be created (default: cwd)', process.cwd())
      .addOption('force', 'f', 'Replace directory', false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const name = this.getOption('name');
    const force = this.getOption('force');
    const templatePath = this._getTemplatePath();
    const directory = path.resolve(this.getOption('directory'));

    if (!force && fs.existsSync(directory)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      fs.readdir(templatePath, (err, data) => {
        return err ? reject(err) : resolve(data);
      });
    }).then(data => {
      const promises = data.map(file => {
        const twigReg = /\.twig$/;
        const outFile = path.join(directory, file);
        const srcFile = path.join(templatePath, file);

        return twigReg.test(srcFile)
          ? this._saveRendered(srcFile, { name: name }, outFile.replace(twigReg, ''))
          : fse.copy(srcFile, outFile);
      });

      return Promise.all(promises);
    });
  }

  /**
   * @returns {String}
   * @private
   */
  _getTemplatePath() {
    const { provider } = this.getConfig();
    const template = this.getOption('template');
    const mappingPath = path.join(__dirname, '../templates/mapping.json');
    const mapping = require(mappingPath)[provider];

    if (!Object.keys(mapping).includes(template)) {
      throw new Error(`${template} is not supported`);
    }

    return path.join(path.dirname(mappingPath), mapping[template]);
  }

  /**
   * @param {String} srcFile
   * @param {Object} variables
   * @param {String} outFile
   * @returns {Promise}
   * @private
   */
  _saveRendered(srcFile, variables, outFile) {
    return new Promise((resolve, reject) => {
      Twig.renderFile(srcFile, variables, (err, data) => {
        if (err) {
          return reject(err);
        }

        fs.writeFile(outFile, data, 'utf-8', (err, data) => {
          return resolve(data);
        });
      });
    });
  }
}

module.exports = CreateCommand;
