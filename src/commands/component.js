'use strict';

const path = require('path');
const glob = require('glob');
const fse = require('fs-extra');
const { templates } = require('../parameters');
const ConfigLoader = require('../config-loader');
const AbstractCommand = require('../abstract-command');
const Terraform = require('../helpers/wrappers/terraform');
const { renderTwig, isAwsNameValid, getNonUniqNames, extend, yesNoQuestion, printListAsTree } = require('../helpers/util');

class ComponentCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('component')
      .setDescription('create new or include existing terraform configuration into current terrahub project')
      .addOption('name', 'n', 'Uniquely identifiable cloud resource name', Array)
      .addOption('template', 't', 'Template name (e.g. aws_ami, google_project)', String, '')
      .addOption('directory', 'd', 'Path to the component (default: cwd)', String, process.cwd())
      .addOption('depends-on', 'o', 'List of paths to components that depend on current component' +
        ' (comma separated)', Array, [])
      .addOption('force', 'f', 'Replace directory. Works only with template option', Boolean, false)
      .addOption('delete', 'D', 'Delete terrahub configuration files in the component folder', Boolean, false)
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this._name = this.getOption('name');
    this._template = this.getOption('template');
    this._directory = this.getOption('directory');
    this._dependsOn = this.getOption('depends-on');
    this._force = this.getOption('force');
    this._delete = this.getOption('delete');

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

    if (this._name.some(it => !isAwsNameValid(it))) {
      throw new Error(`Name is not valid. Only letters, numbers, hyphens, or underscores are allowed.`);
    }

    const _duplicatedNames = getNonUniqNames(this._name, this.getConfig());

    Object.keys(_duplicatedNames).forEach(name => {
      throw new Error(`Terrahub component with provided name '${name}'`+
        ` already exists in '${_duplicatedNames[name]}' directory.`);
    });  
    
    const names = this._name;

    if (this._delete) {
      const inexistentComponents = names.filter(it => !this.getConfigPath(it));
      if (inexistentComponents.length) {
        throw new Error(`Terrahub components with provided names '${inexistentComponents.join(`', '`)}' don't exist.`);
      }

      printListAsTree(this.getConfig(), this.getProjectConfig().name);

      return yesNoQuestion('Do you want to perform delete action? (y/N) ').then(answer => {
        if (!answer) {
          return Promise.reject('Action aborted');
        }

        return Promise.all(names.map(it => this._deleteComponent(it)))
          .then(() => `'${names.join(`', '`)}' Terrahub component${names.length > 1 ? 's' : ''} successfully deleted.`);
      });
    } else if (this._template) {
      return Promise.all(names.map(it => this._createNewComponent(it))).then(data => {
        if (data.some(it => !it)) {
          return Promise.resolve();
        }

        return Promise.resolve('Done');
      });
    }


    return Promise.all(names.map(it => this._addExistingComponent(it))).then(() => 'Done');
  }

  /**
   * @param {String} name
   * @return {Promise}
   * @private
   */
  _deleteComponent(name) {
    const configPath = this.getConfigPath(name);
    const configFiles = this.listAllEnvConfig(configPath);

    return Promise.all(configFiles.map(it => fse.remove(it)));
  }

  /**
   * @param {String} name
   * @return {Promise}
   * @private
   */
  _addExistingComponent(name) {
    const directory = path.resolve(this._directory);
    const projectPath = this.getAppPath();
    const componentPath = this._configLoader.relativePath(process.cwd());
    const terraform = new Terraform({ root: componentPath, project: { root: projectPath } });

    return terraform.workspaceList()
      .then(({ workspaces }) => {
        workspaces.forEach(it => {
          if (it !== 'default') {
            const outFile = path.join(directory, `.terrahub.${it}${this.getProjectFormat()}`);
            ConfigLoader.writeConfig({}, outFile);
          }
        });

        return Promise.resolve();
      }).catch(() => Promise.resolve())
      .then(() => {
        const existing = this._findExistingComponent();

        if (!fse.pathExistsSync(directory)) {
          throw new Error(`Couldn't create '${directory}' because path is invalid.`);
        }

        let outFile = path.join(directory, this._defaultFileName());
        let componentData = { component: { name: name } };

        componentData.component['dependsOn'] = this._dependsOn;

        if (fse.pathExistsSync(outFile)) {
          const config = ConfigLoader.readConfig(outFile);
          if (config.project) {
            throw new Error(`Configuring components in project's root is NOT allowed.`);
          }
        }

        if (!this._force && fse.pathExistsSync(outFile)) {
          this.logger.warn(`Component '${name}' already exists`);
          return Promise.resolve();
        }

        if (existing.name) {
          componentData.component = extend(existing.config[existing.name], [componentData.component]);
          delete existing.config[existing.name];

          ConfigLoader.writeConfig(existing.config, existing.path);
        }

        this._createWorkspaceFiles(this._directory);

        const templateName = this._configLoader.getDefaultFileName() + '.twig';
        const specificConfigPath = path.join(path.dirname(templates.config), templateName);
        const data = fse.existsSync(specificConfigPath) ? fse.readFileSync(specificConfigPath) : '';

        return renderTwig(
          this._srcFile, { name: name, dependsOn: this._dependsOn, data: data }, outFile
        ).then(() => 'Done');
      });
  }

  /**
   * @param {String} name
   * @return {Promise}
   * @private
   */
  _createNewComponent(name) {
    const { code } = this.getProjectConfig();
    const directory = path.resolve(this._directory, name);
    const templatePath = this._getTemplatePath();

    if (!this._force && fse.pathExistsSync(directory)) {
      this.logger.warn(`Component '${name}' already exists`);
      return Promise.resolve();
    }

    this._createWorkspaceFiles(directory);

    return Promise.all(
      glob.sync('**', { cwd: templatePath, nodir: true, dot: false }).map(file => {

        const twigReg = /\.twig$/;
        const outFile = path.join(directory, file);
        const srcFile = path.join(templatePath, file);
        return twigReg.test(srcFile)
          ? renderTwig(srcFile, { name: name, code: code }, outFile.replace(twigReg, ''))
          : fse.copy(srcFile, outFile);
      })
    ).then(() => {
      const outFile = path.join(directory, this._defaultFileName());
      const specificConfigPath = path.join(templatePath, this._configLoader.getDefaultFileName() + '.twig');
      let data = '';
      if (fse.existsSync(specificConfigPath)) {
        data = fse.readFileSync(specificConfigPath);
      }
      return renderTwig(this._srcFile, { name: name, dependsOn: this._dependsOn, data: data }, outFile);
    }).then(() => {
      const outFile = path.join(directory, this._defaultFileName());
      return renderTwig(outFile, { name: name, code: code }, outFile);
    }).then(() => 'Done');
  }

  /**
   * @returns {Object}
   * @private
   */
  _findExistingComponent() {
    const componentRoot = this.relativePath(this._directory);
    const cfgPath = path.resolve(this._appPath, this._defaultFileName());

    let name = '';
    let rawConfig = ConfigLoader.readConfig(cfgPath);

    Object.keys(rawConfig).forEach(key => {
      if (rawConfig[key].hasOwnProperty('root')) {
        rawConfig[key].root = rawConfig[key].root.replace(/\/$/, '');

        if (path.resolve(rawConfig[key].root) === path.resolve(componentRoot)) {
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
  _defaultFileName() {
    return this.getDefaultFileName() ? `.terrahub${this.getProjectFormat()}` : this.getDefaultFileName();
  }

  /**
   * @returns {String}
   * @private
   */
  _getTemplatePath() {
    const keys = this._template.split('_');
    const provider = keys.shift();
    const resourceName = this._template.replace(provider + '_', '');
    const templateDir = path.join(path.dirname(templates.path), provider, resourceName);

    if (!fse.pathExistsSync(templateDir)) {
      throw new Error(`${this._template} is not supported`);
    }

    return templateDir;
  }

  /**
   * @param {String} directory 
   */
  _createWorkspaceFiles(directory) {
    this._getWorkspaceFiles().map(file => {
      ConfigLoader.writeConfig({}, path.join(directory, file));
    });
  }

  /**
   * @return {String[]}
   */
  _getWorkspaceFiles() {
    if (!this._workspaceFiles) {
      const projectPath = this.getAppPath();
      const ignorePatterns = this.getProjectConfig().ignore || ConfigLoader.defaultIgnorePatterns;

      this._workspaceFiles = glob.sync('.terrahub.*', { cwd: projectPath, dot: true, ignore: ignorePatterns })
        .filter(it => it !== this._defaultFileName());
    }

    return this._workspaceFiles;
  }
}

module.exports = ComponentCommand;
