'use strict';

const path = require('path');
const { homePath } = require('../helpers/util');
const ConfigLoader = require('../config-loader');
const { exec } = require('child-process-promise');
const Downloader = require('../helpers/downloader');
const TerraformCommand = require('../terraform-command');
const { commandsPath, jitPath, config } = require('../parameters');
const { yesNoQuestion, printListAuto } = require('../helpers/util');

class ConvertCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('convert')
      .setDescription('convert terraform configuration into yaml, json or hcl format (both directions)')
      .addOption('to', 't', 'Convert current component TO another format (e.g. yml, hcl; default: yml)', String, 'yml')
      .addOption('auto-approve', 'y', 'Auto approve config conversion', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    const format = this.getOption('to');
    ConvertCommand._validateFormat(format);

    const config = this.getConfigObject();

    return this.askForApprovement(
      config,
      this.getOption('auto-approve'),
      `Are you sure you want to convert all of the components above into '${format}' format? (y/N) `
    ).then(answer => {
      if (!answer) {
        return Promise.reject('Action aborted');
      }

      return Promise.all(Object.keys(config).map(hash => this._convertComponent(config[hash], format)));
    }).then(() => 'Done');
  }

  /**
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _saveComponent(config) {
    const configPath = ConvertCommand._buildComponentPath(config);

    const tmpPath = homePath(jitPath);
    const arch = (new Downloader()).getOsArch();
    const componentBinPath = `${commandsPath}/../../bin/${arch}`;

    return exec(`${componentBinPath}/component -thub ${tmpPath} ${configPath} ${config.name}`);
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  _toYml(cfg) {
    const rawConfig = ConfigLoader.readConfig(
      path.join(ConvertCommand._buildComponentPath(cfg), config.defaultFileName)
    );

    if (!rawConfig.component.hasOwnProperty('template')) {
      return ConvertCommand._revertComponent(cfg).then(() => {
        this.logSuccess(cfg.name, 'YML');
      });
    }

    this.logSkip(cfg.name, 'YML');
    return Promise.resolve();
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  _toHcl(cfg) {
    const rawConfig = ConfigLoader.readConfig(
      path.join(ConvertCommand._buildComponentPath(cfg), config.defaultFileName)
    );

    if (rawConfig.component.hasOwnProperty('template')) {
      return this._saveComponent(cfg).then(() => {
        this.logSuccess(cfg.name, 'HCL');
      });
    }

    this.logSkip(cfg.name, 'HCL');
    return Promise.resolve();
  }

  /**
   * @param {Object} config
   * @param {String} format
   * @return {Promise}
   * @private
   */
  _convertComponent(config, format) {
    let promise;

    switch (format) {
      case 'yaml':
      case 'yml':
        promise = this._toYml(config);
        break;

      case 'hcl':
        promise = this._toHcl(config);
        break;
    }

    return promise;
  }

  /**
   * @param {String} name
   * @param {String} format
   */
  logSuccess(name, format) {
    this.logger.warn(`Component '${name}' was successfully converted in ${format} format.`);
  }

  /**
   * @param {String} name
   * @param {String} format
   */
  logSkip(name, format) {
    this.logger.info(`Component '${name}' is already in ${format} format.`);
  }

  /**
   * @param {Object} config
   * @return {String}
   * @private
   */
  static _buildComponentPath(config) {
    return path.join(config.project.root, config.root);
  }

  /**
   * @param format
   * @private
   */
  static _validateFormat(format) {
    if (!ConvertCommand._supportedFormats.includes(format)) {
      throw new Error(`'${format}' format is not supported for configuration conversion.`);
    }
  }

  /**
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  static _revertComponent(config) {
    const configPath = ConvertCommand._buildComponentPath(config);

    const arch = (new Downloader()).getOsArch();
    const componentBinPath = `${commandsPath}/../../bin/${arch}`;

    return exec(`${componentBinPath}/generator -thub ${configPath}/ ${configPath}/`);
  }

  /**
   * @return {String[]}
   * @private
   */
  static get _supportedFormats() {
    return ['yml', 'yaml', 'hcl'];
  }
}

module.exports = ConvertCommand;
