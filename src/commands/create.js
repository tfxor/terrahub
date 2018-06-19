'use strict';

const fse = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { renderTwig } = require('../helpers/util');
const { config, templates } = require('../parameters');
const AbstractCommand = require('../abstract-command');

class CreateCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('create')
      .setDescription('Create terraform code from predefined templates')
      .addOption('name', 'n', 'Uniquely identifiable cloud resource name', String)
      .addOption('template', 't', 'Template name (e.g. cloudfront, dynamodb, lambda, s3)', String)
      .addOption('directory', 'd', 'Path where template should be created (default: cwd)', String, process.cwd())
      .addOption('parent', 'p', 'Parent component path', String, '')
      .addOption('force', 'f', 'Replace directory', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const name = this.getOption('name');
    const force = this.getOption('force');
    const parent = this.getOption('parent');
    const templatePath = this._getTemplatePath();
    const directory = path.resolve(this.getOption('directory'), name);

    if (!force && fse.existsSync(directory)) {
      this.logger.info(`Component '${name}' already exists`);
      return Promise.resolve();
    }

    return Promise.all(
      glob.sync('**', { cwd: templatePath, nodir: true, dot: true }).map(file => {
        const twigReg = /\.twig$/;
        const outFile = path.join(directory, file);
        const srcFile = path.join(templatePath, file);

        return twigReg.test(srcFile)
          ? renderTwig(srcFile, { name: name }, outFile.replace(twigReg, ''))
          : fse.copy(srcFile, outFile);
      })
    ).then(() => {
      const srcFile = path.join(templates.configs, 'component', `.terrahub.${config.format}.twig`);
      const outFile = path.join(directory, `.terrahub.${config.format}`);

      return renderTwig(srcFile, { name: name, parent: parent }, outFile);
    }).then(() => 'Done');
  }

  /**
   * @returns {String}
   * @private
   */
  _getTemplatePath() {
    const { provider } = this.getProjectConfig();
    const template = this.getOption('template');
    const mapping = require(templates.mapping)[provider];

    if (!Object.keys(mapping).includes(template)) {
      throw new Error(`${template} is not supported`);
    }

    return path.join(path.dirname(templates.mapping), mapping[template]);
  }
}

module.exports = CreateCommand;
