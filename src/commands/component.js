'use strict';

const fse = require('fs-extra');
const path = require('path');
const glob = require('glob');
const ConfigLoader = require('../config-loader');
const { config, templates } = require('../parameters');
const { renderTwig, isAwsNameValid, extend } = require('../helpers/util');
const AbstractCommand = require('../abstract-command');

class ComponentCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('component')
      .setDescription('create new or include existing terraform configuration into current terrahub project')
      .addOption('name', 'n', 'Uniquely identifiable cloud resource name', String)
      .addOption('template', 't', 'Template name (e.g. aws_lambda_function, google_cloudfunctions_function)', String, '')
      .addOption('directory', 'd', 'Path to the component (default: cwd)', String, process.cwd())
      .addOption('parent', 'p', 'Parent component path', String, '')
      .addOption('force', 'f', 'Replace directory. Works only with template option', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this._name = this.getOption('name');
    this._template = this.getOption('template');
    this._directory = this.getOption('directory');
    this._parent = this.getOption('parent');
    this._force = this.getOption('force');

    if (!isAwsNameValid(this._name)) {
      throw new Error(`Name is not valid. Only letters, numbers, hyphens, or underscores are allowed.`);
    }

    return this._template ? this._createNewComponent() : this._addExistingComponent();
  }

  /**
   * @return {Promise}
   * @private
   */
  _addExistingComponent() {
    const directory = path.resolve(this._directory);

    const existing = this._findExistingComponent();

    if (!fse.pathExistsSync(directory)) {
      throw new Error(`Couldn\'t create '${directory}' because path is invalid.`);
    }

    let outFile = path.join(directory, config.fileName);
    let component = { name: this._name };

    if (this._parent) {
      component['parent'] = this._parent;
    }

    if (fse.pathExistsSync(outFile)) {
      const config = ConfigLoader.readConfig(outFile);

      throw new Error(config.project ? 'Configuring components in project\'s root is NOT allowed.'
        : 'Couldn\'t create because terraform component already exists');
    }

    if (existing.name) {
      component = extend(existing.config[existing.name], [component]);
      delete existing.config[existing.name];

      ConfigLoader.writeConfig(existing.config, existing.path);
    }

    ConfigLoader.writeConfig(component, outFile);

    return Promise.resolve('Done');
  }

  /**
   * @return {Promise}
   * @private
   */
  _createNewComponent() {
    const { code } = this.getProjectConfig();
    const directory = path.resolve(this._directory, this._name);
    const templatePath = this._getTemplatePath();

    if (!this._force && fse.pathExistsSync(directory)) {
      this.logger.warn(`Component '${this._name}' already exists`);
      return Promise.resolve();
    }

    return Promise.all(
      glob.sync('**', { cwd: templatePath, nodir: true, dot: true }).map(file => {
        const twigReg = /\.twig$/;
        const outFile = path.join(directory, file);
        const srcFile = path.join(templatePath, file);

        return twigReg.test(srcFile)
          ? renderTwig(srcFile, { name: this._name, code: code }, outFile.replace(twigReg, ''))
          : fse.copy(srcFile, outFile);
      })
    ).then(() => {
      const srcFile = path.join(templates.config, 'component', `.terrahub.${config.format}.twig`);
      const outFile = path.join(directory, config.defaultFileName);

      return renderTwig(srcFile, { name: this._name, parent: this._parent }, outFile);
    }).then(() => 'Done');
  }

  /**
   * @returns {Object}
   * @private
   */
  _findExistingComponent() {
    let cfgPath = path.resolve(process.cwd(), config.defaultFileName);
    let componentRoot = this.relativePath(this._directory);

    if (!fse.pathExistsSync(cfgPath)) {
      throw new Error(`Project's root config not found`);
    }

    let name = '';
    let rawConfig = ConfigLoader.readConfig(cfgPath);

    Object.keys(rawConfig).forEach(key => {
      if ('root' in rawConfig[key]) {
        rawConfig[key].root = rawConfig[key].root.replace(/\/$/, '');

        if (rawConfig[key].root === componentRoot) {
          name = key;
        }
      }
    });

    return { name: name, path: cfgPath, config: rawConfig };
  }

  /**
   * @returns {String}
   * @private
   */
  _getTemplatePath() {
    const { provider } = this.getProjectConfig();

    const mapping = require(templates.mapping)[provider];

    if (!Object.keys(mapping).includes(this._template)) {
      throw new Error(`${this._template} is not supported`);
    }

    return path.join(path.dirname(templates.mapping), mapping[this._template]);
  }
}

module.exports = ComponentCommand;
