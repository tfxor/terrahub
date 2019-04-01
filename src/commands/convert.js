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
      .setDescription('create new or include existing terraform configuration into current terrahub project')
      .addOption('component', 'c', 'Uniquely identifiable cloud resource name', Array)
      .addOption('directory', 'd', 'Path to the component (default: cwd)', String, process.cwd())
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this._componentName = this.getOption('component');
    this._directory = this.getOption('directory');

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
    const configPath = this._getConfigPath(name);
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
    const configPath = this._getConfigPath(name);
    if (!configPath) {
      return Promise.resolve();
    }     
    const arch = (new Downloader()).getOsArch();
    const componentBinPath = `${commandsPath}/../../bin/${arch}`
    
    return exec(`${componentBinPath}/generator -thub ${configPath}/ ${configPath}/`);
  }

  /**
   * @param {String} name
   * @return {Promise}
   * @private
   */
  _getConfigPath(name) {
    const config = this.getConfig();
    const key = Object.keys(config).find(it => config[it].name === name);
    return config[key] ? path.join(config[key].project.root, config[key].root) : ''; 
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
        
        if (config.component.template) {
        return yesNoQuestion('Are you sure you want to make terrahub config more descriptive as terraform configurations? (Y/N) ').then(answer => {
            if (!answer) {
            return Promise.reject('Action aborted');
            }
            return this._saveComponent(name);
        });
        }

        return yesNoQuestion('Are you sure you want to compress terraform configurations into terrahub config? (Y/N) ').then(answer => {
        if (!answer) {
            return Promise.reject('Action aborted');
        }
        return this._revertComponent(name);
        });
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
