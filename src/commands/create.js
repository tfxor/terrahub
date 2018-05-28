'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const { renderTwig } = require('../helpers/util');
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
      .addOption('force', 'f', 'Replace directory', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const twigReg = /\.twig$/;
    const name = this.getOption('name');
    const force = this.getOption('force');
    const templatePath = this._getTemplatePath();
    const directory = path.resolve(this.getOption('directory'), name);

    if (!force && fs.existsSync(directory)) {
      this.logger.info(`Component ${name} already exists`);
      return Promise.resolve();
    }

    return Promise.all(
      fs.readdirSync(templatePath).map(file => {
        const outFile = path.join(directory, file);
        const srcFile = path.join(templatePath, file);

        return twigReg.test(srcFile)
          ? renderTwig(srcFile, { name: name }, outFile.replace(twigReg, ''))
          : fse.copy(srcFile, outFile);
      })
    ).then(() => {
      const componentsPath = path.join(__dirname, '../templates/configs/component');
      const srcFile = `${componentsPath}/.terrahub.yml.twig`;
      const outFile = path.join(directory, path.basename(srcFile).replace(twigReg, ''));

      return renderTwig(srcFile, { name: name, global: '../.xxx.json' }, outFile);
    }).then(() => 'Done');
  }

  /**
   * @returns {String}
   * @private
   */
  _getTemplatePath() {
    // @todo use project config block
    // const { provider } = this.getConfig();
    const provider = 'aws';
    const template = this.getOption('template');
    const mappingPath = path.join(__dirname, '../templates/mapping.json');
    const mapping = require(mappingPath)[provider];

    if (!Object.keys(mapping).includes(template)) {
      throw new Error(`${template} is not supported`);
    }

    return path.join(path.dirname(mappingPath), mapping[template]);
  }
}

module.exports = CreateCommand;
