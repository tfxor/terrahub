'use strict';

const fse = require('fs-extra');
const { join, sep } = require('path');
const hcltojson = require('hcl-to-json');
const { exec } = require('child-process-promise');
const logger = require('../helpers/logger');
const Downloader = require('../helpers/downloader');
const DistributedCommand = require('../distributed-command');
const { yamlToJson } = require('../helpers/util');
const { buildTmpPath, checkTfVersion, convertJsonToHcl } = require('../helpers/hcl-helper');
const LocalDistributor = require('../helpers/distributors/local-distributor');

class ConvertCommand extends DistributedCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('convert')
      .setDescription('convert terraform configuration into yaml, json or hcl format (both directions)')
      .addOption('to', 't', 'Convert current component TO another format (e.g. yml, hcl; default: yml)', String, 'yml')
      .addOption('auto-approve', 'y', 'Auto approve config conversion', Boolean, false);
  }

  /**
   * @returns {Promise}
   */
  async run() {
    const format = this.getOption('to');
    ConvertCommand._validateFormat(format);

    const config = this.getFilteredConfig();

    const answer = await this.askForApprovement(
      config,
      this.getOption('auto-approve'),
      `Are you sure you want to convert all of the components above into '${format}' format? (y/N) `
    );
    if (!answer) {
      throw new Error('Action aborted');
    }

    await Promise.all(Object.keys(config).map(hash => this._convertComponent(config[hash], format)));
    return 'Done';
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  _toYml(cfg) {
    switch (this._checkCurrentFormat(cfg)) {
      case 'json':
        return this._toYamlFromJson(cfg);
      case 'hcl':
        return this._toYamlFromHcl(cfg);
      case 'yaml':
        this.logSkip(cfg.name, 'YML');
        return Promise.resolve();
    }
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  _toHcl(cfg) {
    switch (this._checkCurrentFormat(cfg)) {
      case 'yaml':
        return this._toHCLFromYaml(cfg);
      case 'json':
        return this._toHCLFromJson(cfg);
      case 'hcl':
        this.logSkip(cfg.name, 'HCL');
        return Promise.resolve();
    }
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  _toJson(cfg) {
    switch (this._checkCurrentFormat(cfg)) {
      case 'yaml':
        return this._toJsonFromYaml(cfg);
      case 'hcl':
        return this._toJsonFromHcl(cfg);
      case 'json':
        this.logSkip(cfg.name, 'JSON');
        return Promise.resolve();
    }
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  async _toJsonFromYaml(cfg) {
    await this._initTemplateFromConfig(cfg);
    const templatePath = ConvertCommand._buildComponentPath(cfg);
    const componentPath = buildTmpPath(cfg, this.parameters);

    try {
      const files = await fse.readdir(componentPath);
      const promises = await this._hclToJson(files, componentPath, templatePath);

      await Promise.all(promises);

      return this._deteleTemplateFromConfig(cfg);
    } catch (err) {
      throw new Error(err.toString());
    }
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  async _toJsonFromHcl(cfg) {
    const scriptPath = ConvertCommand._buildComponentPath(cfg);

    try {
      const files = await fse.readdir(scriptPath);
      const promises = await this._hclToJson(files, scriptPath, scriptPath);

      await Promise.all(promises);
    } catch (err) {
      throw new Error(err.toString());
    }
  }

  /**
   * @param {Array} files
   * @param {String} terraformPath
   * @param {String} scriptPath
   * @return {Promise}
   * @private
   */
  async _hclToJson(files, terraformPath, scriptPath) {
    const regEx = /.*(tf|tfvars)$/;
    const scriptFiles = files.filter(src => regEx.test(src));
    const promises = [];

    for (const file of scriptFiles) {
      // eslint-disable-next-line no-await-in-loop
      const dataBuffer = await fse.readFile(join(terraformPath, file));
      const jsonContent = hcltojson(dataBuffer.toString());

      promises.push(fse.outputJson(join(scriptPath, file), jsonContent, { spaces: 2 }));
    }

    return promises;
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  async _toHCLFromYaml(cfg) {
    await this._initTemplateFromConfig(cfg);
    const templatePath = ConvertCommand._buildComponentPath(cfg);
    const regEx = /.*(tf|tfvars)$/;
    const componentPath = buildTmpPath(cfg, this.parameters);

    try {
      const files = await fse.readdir(componentPath);
      const terraformFiles = files.filter(src => regEx.test(src));

      const promises = terraformFiles.map(file => {
        return fse.copySync(join(componentPath, file), join(templatePath, file));
      });

      await Promise.all(promises);

      return this._deteleTemplateFromConfig(cfg);
    } catch (err) {
      throw new Error(err.toString());
    }
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  _toYamlFromJson(cfg) {
    return Promise.resolve();
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  async _toYamlFromHcl(cfg) {
    const scriptPath = ConvertCommand._buildComponentPath(cfg);
    const promises = [];

    try {
      const files = await fse.readdir(scriptPath);
      const regEx = /.*(tf|tfvars)$/;
      const scriptFiles = files.filter(src => regEx.test(src));
      let jsonContent = yamlToJson(join(scriptPath, '.terrahub.yml'));
      jsonContent['template'] = {};

      for (const file of scriptFiles) {
        // eslint-disable-next-line no-await-in-loop
        const dataBuffer = await fse.readFile(join(scriptPath, file));
        const fileName = file.split('.');
        const key = fileName[0];
        jsonContent.component.template[key] = { key: hcltojson(dataBuffer.toString()) };

        promises.push(Promise.resolve());
        // return fse.outputJson(join(scriptPath, file), jsonContent, { spaces: 2 });
      }

      return Promise.all(promises);
    } catch (err) {
      throw new Error(err.toString());
    }
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  async _toHCLFromJson(cfg) {
    const scriptPath = ConvertCommand._buildComponentPath(cfg);
    const promises = [];
    try {
      const files = await fse.readdir(scriptPath);
      const regEx = /.*(tf|tfvars)$/;
      const scriptFiles = files.filter(src => regEx.test(src));

      for (const file of scriptFiles) {
        // eslint-disable-next-line no-await-in-loop
        const data = await fse.readJson(join(scriptPath, file));
        promises.push(convertJsonToHcl(join(scriptPath, file), data, checkTfVersion(cfg), this.parameters));
      }

      return Promise.all(promises);
    } catch (err) {
      throw new Error(err.toString());
    }
  }

  /**
   *
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  _deteleTemplateFromConfig(cfg) {
    const { name } = cfg;
    const Command = require(join(this.parameters.commandsPath, 'configure'));
    const parameters = Object.assign(this.parameters,
      {
        args: {
          i: `${name}`, c: 'component.template', D: true, y: true
        }
      });

    const configureCommand = new Command(parameters, logger);
    return new LocalDistributor(configureCommand).run();
  }

  /**
   * @param {Object} cfg
   * @return {Promise}
   * @private
   */
  _initTemplateFromConfig(cfg) {
    const { name } = cfg;
    const Command = require(join(this.parameters.commandsPath, 'init'));
    const parameters = Object.assign(this.parameters, { args: { i: `${name}` } });

    const configureCommand = new Command(parameters, logger);
    return new LocalDistributor(configureCommand).run();
  }

  /**
   * @param {Object} cfg
   * @return {String}
   * @private
   */
  _checkCurrentFormat(cfg) {
    if (!this._checkIfFilesIsJson(cfg)) {
      return (!cfg.hasOwnProperty('template')) ? (checkTfVersion(cfg)) ? 'hcl2' : 'hcl' : 'yaml';
    }

    return 'json';
  }

  /**
   * @param {Object} config
   * @param {String} format
   * @return {Promise}
   * @private
   */
  async _convertComponent(config, format) {
    let promise;
    switch (format) {
      case 'yaml':
      case 'yml':
        promise = await this._toYml(config);
        break;

      case 'hcl':
        promise = await this._toHcl(config);
        break;

      case 'hcl2':
        promise = await this._toHcl(config);
        break;

      case 'json':
        promise = await this._toJson(config);
        break;
    }

    return promise;
  }

  /**
   * @param {String} name
   * @param {String} format
   */
  logSuccess(name, format) {
    this.logger.info(`Component '${name}' was successfully converted in ${format} format.`);
  }

  /**
   * @param {String} name
   * @param {String} format
   */
  logSkip(name, format) {
    this.logger.warn(`Component '${name}' is already in ${format} format.`);
  }

  /**
   * @param {Object} config
   * @return {String}
   * @private
   */
  static _buildComponentPath(config) {
    return join(config.project.root, config.root);
  }

  /**
   * @param {String} format
   * @private
   */
  static _validateFormat(format) {
    if (!ConvertCommand._supportedFormats.includes(format)) {
      throw new Error(`'${format}' format is not supported for configuration conversion.`);
    }
  }


  /**
   * @param {Object} config
   * @return {Boolean}
   * @private
   */
  _checkIfFilesIsJson(config) {
    const configPath = ConvertCommand._buildComponentPath(config);
    const mainFilePath = `${configPath}${sep}main.tf`;

    try {
      const rawData = fse.readFileSync(mainFilePath, 'utf8');

      JSON.parse(rawData);
    } catch (ex) {
      return false;
    }

    return true;
  }



  /**
   * @return {String[]}
   * @private
   */
  static get _supportedFormats() {
    return ['yml', 'yaml', 'hcl', 'hcl2', 'json'];
  }
}

module.exports = ConvertCommand;
