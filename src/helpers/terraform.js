'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const Metadata = require('./metadata');
const semver = require('semver');
const logger = require('./logger');
const { spawn } = require('child-process-promise');
const Downloader = require('./downloader');
const { extend } = require('../helpers/util');
const { homePath } = require('../parameters');

class Terraform {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this._config = extend({}, [this._defaults(), config]);
    this._tf = this._config.terraform;
    this._metadata = new Metadata(this._config);
    this._showLogs = true;
    this._isWorkspaceSupported = false;
  }

  /**
   * @returns {Object}
   * @private
   */
  _defaults() {
    return {
      terraform: {
        var: {},
        varFile: [],
        backend: {},
        version: '0.11.7',
        backup: false,
        workspace: 'default'
      }
    };
  }

  /**
   * Terraform module name
   * @returns {String}
   */
  getName() {
    return this._config.name || this._config.root;
  }

  /**
   * @returns {String}
   */
  getVersion() {
    if (!semver.valid(this._tf.version)) {
      throw new Error(`Terraform version ${this._tf.version} is invalid`);
    }

    return this._tf.version;
  }

  /**
   * @returns {String}
   */
  getRoot() {
    return path.join(this._config.project.root, this._config.root);
  }

  /**
   * @returns {String}
   */
  getBinary() {
    return homePath('terraform', this.getVersion(), 'terraform');
  }

  /**
   * @returns {String}
   */
  getResource() {
    return this.getRoot();
  }

  /**
   * @return {Object}
   */
  getActionOutput() {
    return this._output;
  }

  /**
   * Prepare -var
   * @returns {Array}
   * @private
   */
  _var() {
    const result = [];
    const object = this._tf.var;

    Object.keys(object).forEach(name => {
      result.push(`-var='${name}=${object[name]}'`);
    });

    return result;
  }

  /**
   * Prepare -backend-config
   * @return {Array}
   * @private
   */
  _backend() {
    const result = [];
    const object = this._tf.backend;

    Object.keys(object).forEach(name => {
      result.push(`-backend-config='${name}=${object[name]}'`);
    });

    return result;
  }

  /**
   * Prepare -var-file
   * @returns {Array}
   * @private
   */
  _varFile() {
    const result = [];

    this._tf.varFile.forEach(fileName => {
      result.push(`-var-file='${path.join(this.getRoot(), fileName)}'`);
    });

    return result;
  }

  /**
   * Perform terraform init & all required checks
   * @returns {Promise}
   */
  prepare() {
    logger.debug(JSON.stringify(this._config, null, 2));

    return this._checkTerraformBinary()
      .then(() => this._checkWorkspaceSupport())
      .then(() => this._checkResourceDir());
  }

  /**
   * Ensure binary exists (download otherwise)
   * @returns {Promise}
   */
  _checkTerraformBinary() {
    if (fs.existsSync(this.getBinary())) {
      return Promise.resolve();
    }

    return (new Downloader()).download(this.getVersion());
  }

  /**
   * @returns {Promise}
   * @private
   */
  _checkResourceDir() {
    return fse.ensureDir(this.getResource());
  }

  /**
   * Check if workspaces supported
   * @private
   */
  _checkWorkspaceSupport() {
    this._isWorkspaceSupported = semver.satisfies(this.getVersion(), '>=0.9.0');
  }

  /**
   * Re-init State & Plan paths
   * @note required after workspace & remote state
   * @return {Promise}
   * @private
   */
  _reInitPaths() {
    this._metadata.init();

    return Promise.resolve();
  }

  /**
   * https://www.terraform.io/docs/commands/init.html
   * @returns {Promise}
   */
  init() {
    return this
      .run('init', ['-no-color', this._optsToArgs({ '-input': false }), ...this._backend(), '.'])
      .then(() => this._reInitPaths());
  }

  /**
   * https://www.terraform.io/docs/commands/state/pull.html
   * @returns {Promise}
   */
  statePull() {
    if (!this._metadata.isRemote()) {
      return Promise.resolve();
    }

    this._showLogs = false;

    return this.run('state', ['pull', '-no-color']).then(result => {
      this._showLogs = true;
      const backupPath = this._metadata.getStateBackupPath();
      const pullStateContent = JSON.parse(result.toString());

      return fse.ensureFile(backupPath)
        .then(() => fse.writeJson(backupPath, pullStateContent))
        .then(() => Promise.resolve(backupPath));
    });
  }

  /**
   * https://www.terraform.io/docs/commands/output.html
   * @returns {Promise}
   */
  output() {
    const options = {};

    this._showLogs = false;

    return this.run('output', (process.env.format === 'json' ? ['-json'] : []).concat(this._optsToArgs(options)));
  }

  /**
   * https://www.terraform.io/docs/commands/workspace/select.html
   * @returns {Promise}
   */
  workspaceSelect() {
    if (!this._isWorkspaceSupported) {
      return Promise.resolve();
    }

    const workspace = this._tf.workspace;
    const regexAll = new RegExp(`(\\*\\s|\\s.)${workspace}$`, 'm');

    return this.run('workspace', ['list'])
      .then(result => {
        const regexSelected = new RegExp(`\\*\\s${workspace}$`, 'm');
        const isWorkspaceSelected = regexSelected.test(result.toString());

        return isWorkspaceSelected ? 
          Promise.resolve() :
          this.run('workspace', [regexAll.test(result.toString()) ? 'select' : 'new', workspace])
      })
      .then(() => this._reInitPaths());
  }

  /**
   * https://www.terraform.io/docs/commands/workspace/delete.html
   * @returns {Promise}
   */
  workspaceDelete() {
    if (!this._isWorkspaceSupported) {
      return Promise.resolve();
    }

    return this
      .run('workspace', ['select', 'default'])
      .then(() => this.run('workspace', ['delete', this._tf.workspace]));
  }

  /**
   * https://www.terraform.io/docs/commands/plan.html
   * @returns {Promise}
   */
  plan() {
    const options = { '-out': this._metadata.getPlanPath(), '-input': false };

    return this.run('plan', ['-no-color'].concat(this._varFile(), this._var(), this._optsToArgs(options)))
      .then(data => {
        const planPath = this._metadata.getPlanPath();

        if (fse.existsSync(planPath)) {
          const backupPath = this._metadata.getPlanBackupPath();
          const planContent = fse.readFileSync(planPath).toString();

          fse.outputFileSync(backupPath, planContent);
        }

        return Promise.resolve(data);
      });
  }

  /**
   * https://www.terraform.io/docs/commands/apply.html
   * @returns {Promise}
   */
  apply() {
    const options = { '-backup': this._metadata.getStateBackupPath(), '-auto-approve': true, '-input': false };

    return this
      .run('apply', ['-no-color'].concat(this._varFile(), this._var(), this._optsToArgs(options)))
      .then(() => this._getStateContent());
  }

  /**
   * Get state content whether is remote or local
   * @returns {Promise}
   * @private
   */
  _getStateContent() {
    if (this._metadata.isRemote()) {
      return this.statePull().then(path => fse.readFile(path));
    }

    return fse.readFile(this._metadata.getStatePath());
  }

  /**
   * https://www.terraform.io/docs/commands/destroy.html
   * @returns {Promise}
   */
  destroy() {
    const options = { '-backup': this._metadata.getStateBackupPath() };

    return this
      .run('destroy', ['-no-color', '-force'].concat(this._varFile(), this._var(), this._optsToArgs(options)))
      .then(() => this._getStateContent());
  }

  /**
   * https://www.terraform.io/docs/commands/show.html
   * @param {String} planOrStatePath
   * @returns {Promise}
   */
  show(planOrStatePath) {
    return this.run('show', ['-no-color', planOrStatePath]);
  }

  /**
   * Run terraform command
   * @param {String} cmd
   * @param {Array} args
   * @returns {Promise}
   */
  run(cmd, args) {
    if (this._showLogs) {
      logger.warn(`[${this.getName()}] terraform ${cmd} ${args.join(' ')}`);
    }

    return this._spawn(this.getBinary(), [cmd, ...args], {
      cwd: this.getRoot(),
      env: process.env,
      shell: true
    });
  }

  /**
   * Transform options into arguments
   * @param {Object} options
   * @returns {Array}
   * @private
   */
  _optsToArgs(options) {
    const args = [];

    Object.keys(options).forEach(key => {
      args.push(`${key}=${options[key]}`);
    });

    return args;
  }

  /**
   * Handle a spawn
   * @param {String} command
   * @param {Array} args
   * @param {Object} options
   * @returns {Promise}
   * @private
   */
  _spawn(command, args, options) {
    const stdout = [];
    const promise = spawn(command, args, options);
    const child = promise.childProcess;

    child.stderr.on('data', data => logger.error(this._out(data)));
    child.stdout.on('data', data => {
      stdout.push(data);
      if (this._showLogs) {
        logger.raw(this._out(data));
      }
    });

    return promise.then(() => {
      this._output = {
        action: args[0],
        component: this.getName(),
        stdout: Buffer.concat(stdout),
        env: process.env
      };

      return Buffer.concat(stdout);
    });
  }

  /**
   * @param {Buffer} data
   * @returns {String}
   * @private
   */
  _out(data) {
    return `[${this.getName()}] ${data.toString()}`;
  }
}

module.exports = Terraform;
