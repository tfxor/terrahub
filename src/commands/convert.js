'use strict';

const fse = require('fs-extra');
const path = require('path');
const { homePath } = require('../helpers/util');
const Terraform = require('../helpers/terraform');
const ConfigLoader = require('../config-loader');
const { templates, commandsPath, jitPath } = require('../parameters');
const AbstractCommand = require('../abstract-command');
const Downloader = require('../helpers/downloader');
const { exec } = require('child-process-promise');
const { isAwsNameValid, yesNoQuestion } = require('../helpers/util');

class ConvertCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('convert')
      .setDescription('convert terraform configuration into yaml, json or hcl format (both directions)')
      .addOption('name', 'n', 'Uniquely identifiable cloud resource name', Array)
      .addOption('to-yml', '0', 'Convert to YML', Boolean, false)
      .addOption('to-yaml', '0', 'Convert to YAML', Boolean, false)
      .addOption('to-hcl', '1', 'Convert to HCL', Boolean, false)
      // @todo: implement hcl2 and json
      //.addOption('to-hcl2', '2', 'Convert to HCL2', Boolean, false)
      //.addOption('to-json', '3', 'Convert to JSON', Boolean, false)
      .addOption('directory', 'd', 'Path to the component (default: cwd)', String, process.cwd())
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this._componentName = this.getOption('name');
    this._directory = this.getOption('directory');
    this._toYML = this.getOption('to-yml');
    this._toYAML = this.getOption('to-yaml');
    this._toHCL = this.getOption('to-hcl');
    this._toHCL2 = this.getOption('to-hcl2');
    this._toJSON = this.getOption('to-json');

    const projectFormat = this.getProjectFormat();

    this._appPath = this.getAppPath();
    this._srcFile = path.join(
      templates.config,
      'component',
      `.terrahub${projectFormat === '.yaml' ? '.yml' : projectFormat}.twig`
    );

    if (!this._appPath) {
      throw new Error(`Project's config not found`);
    }

    if (this._componentName.some(it => !isAwsNameValid(it))) {
      throw new Error(`Name is not valid. Only letters, numbers, hyphens, or underscores are allowed.`);
    }

    const _componentNames = this._componentName;

    return Promise.all(_componentNames.map(it => this._convertComponent(it))).then(() => 'Done');
  }

  /**
   * @param {String} name
   * @return {Promise}
   * @private
   */
  _saveComponent(name) {
    const configPath = this.getConfigPath(name);
    if (!configPath) {
      return Promise.resolve();
    }     
    const tmpPath = homePath(jitPath);
    const arch = (new Downloader()).getOsArch();
    const componentBinPath = `${commandsPath}/../../bin/${arch}`

    return exec(`${componentBinPath}/component -thub ${tmpPath} ${configPath} ${name}`);
  }

  /**
   * @param {String} name
   * @return {Promise}
   * @private
   */
  _revertComponent(name) {
    const configPath = this.getConfigPath(name);
    if (!configPath) {
      return Promise.resolve();
    }     
    const arch = (new Downloader()).getOsArch();
    const componentBinPath = `${commandsPath}/../../bin/${arch}`
    
    return exec(`${componentBinPath}/generator -thub ${configPath}/ ${configPath}/`);
  }

  /**
   * @param {String} name
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _toYml(name, config) {
    if (!config.component.template) {
      return yesNoQuestion(`Are you sure you want to convert component '${name}' into YML format? (y/N) `).then(answer => {
        if (!answer) {
            return Promise.reject('Action aborted');
        }
        return this._revertComponent(name);
        });
    } else {
      return Promise.reject(`Component '${name}' is already in YML format`);
    }
  }

  /**
   * @param {String} name
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _toHcl(name, config) {
    if (config.component.template) {
      return yesNoQuestion(`Are you sure you want to convert component '${name}' into HCL format? (y/N) `).then(answer => {
          if (!answer) {
          return Promise.reject('Action aborted');
          }
          return this._saveComponent(name);
      });
    } else {
      return Promise.reject(`Component '${name}' is already in HCL format`);
    }
  }

  /**
   * @param {String} name
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  _convert(name, config) {
    if (this._toYML || this._toYAML) {
      return this._toYml(name, config);
    }

    if (this._toHCL) {
      return this._toHcl(name, config);
    }

    if (this._toHCL2 || this._toJSON) {
      // @todo
      return Promise.reject('To do!');
    }

    return Promise.resolve('Done');
  }

  /**
   * @param {String} name
   * @return {Promise}
   * @private
   */
  _convertComponent(name) {
    const directory = path.resolve(this._directory);

    let outFile = path.join(directory, this._defaultFileName());
    let componentData = { component: { name: name } };

    componentData.component['dependsOn'] = this._dependsOn;

    if (fse.pathExistsSync(outFile)) {
        const config = ConfigLoader.readConfig(outFile);
        if (config.project) {
          throw new Error(`Configuring components in project's root is NOT allowed.`);
        }
        return this._convert(name, config);        
    }
    return Promise.resolve('Done');
  }

  /**
   * @returns {String}
   * @private
   */
  _defaultFileName() {
    return this.getDefaultFileName() ? `.terrahub${this.getProjectFormat()}` : this.getDefaultFileName();
  }
}

module.exports = ConvertCommand;
