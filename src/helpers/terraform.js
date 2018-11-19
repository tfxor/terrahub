'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const semver = require('semver');
const logger = require('./logger');
const Metadata = require('./metadata');
const Downloader = require('./downloader');
const { homePath, config } = require('../parameters');
const { extend, spawner, exponentialBackoff } = require('../helpers/util');

class Terraform {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this._config = extend({}, [this._defaults(), config]);
    this._tf = this._config.terraform;
    this._metadata = new Metadata(this._config);
    this._showLogs = process.env.silent === 'false' && !process.env.format;
    this._isWorkspaceSupported = false;
  }

  /**
   * @return {Object}
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
   * @return {String}
   */
  getName() {
    return this._config.name || this._config.root;
  }

  /**
   * @return {String}
   */
  getVersion() {
    if (!semver.valid(this._tf.version)) {
      throw new Error(`Terraform version ${this._tf.version} is invalid`);
    }

    return this._tf.version;
  }

  /**
   * @return {String}
   */
  getRoot() {
    return path.join(this._config.project.root, this._config.root);
  }

  /**
   * @return {String}
   */
  getBinary() {
    return homePath('terraform', this.getVersion(), 'terraform');
  }

  /**
   * @return {String}
   */
  getResource() {
    return this.getRoot();
  }

  /**
   * Prepare -var
   * @return {Array}
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
   * @return {Array}
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
   * @return {Promise}
   */
  prepare() {
    logger.debug(JSON.stringify(this._config, null, 2));

    return this._checkTerraformBinary()
      .then(() => this._checkWorkspaceSupport())
      .then(() => this._checkResourceDir())
      .then(() => ({}));
  }

  /**
   * Ensure binary exists (download otherwise)
   * @return {Promise}
   */
  _checkTerraformBinary() {
    if (fs.existsSync(this.getBinary())) {
      return Promise.resolve();
    }

    return (new Downloader()).download(this.getVersion());
  }

  /**
   * @return {Promise}
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
   * @return {Promise}
   */
  init() {
    const promiseFunction = () => this.run('init',
      ['-no-color', this._optsToArgs({ '-input': false }), ...this._backend(), '.']);

    return exponentialBackoff(promiseFunction,
      { conditionFunction: this._checkIgnoreErrorInit, maxRetries: config.retryCount })
      .then(() => this._reInitPaths())
      .then(() => ({}));
  }

  /**
   * @param {Error} error
   * @return {Boolean}
   * @private
   */
  _checkIgnoreErrorInit(error) {
    return [/timeout/, /connection reset by peer/, /failed to decode/].some(it => it.test(error.message));
  }

  /**
   * https://www.terraform.io/docs/commands/state/pull.html
   * @return {Promise}
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
   * @return {Promise}
   */
  output() {
    const options = {};

    return this.run('output', (process.env.format === 'json' ? ['-json'] : []).concat(this._optsToArgs(options)))
      .then(buffer => ({ buffer: buffer }));
  }

  /**
   * https://www.terraform.io/docs/commands/workspace/select.html
   * @return {Promise}
   */
  workspaceSelect() {
    if (!this._isWorkspaceSupported) {
      return Promise.resolve();
    }
    const workspace = this._tf.workspace;

    return this.run('workspace', ['list'])
      .then(result => {
        const regexSelected = new RegExp(`\\*\\s${workspace}$`, 'm');
        const regexExists = new RegExp(`\\s.${workspace}$`, 'm');
        const output = result.toString();

        return regexSelected.test(output) ?
          Promise.resolve() :
          this.run('workspace', [regexExists.test(output) ? 'select' : 'new', workspace]);
      })
      .then(() => this._reInitPaths())
      .then(() => ({}));
  }

  /**
   * https://www.terraform.io/docs/commands/workspace/delete.html
   * @return {Promise}
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
   * https://www.terraform.io/docs/commands/workspace/list.html
   * @return {Promise}
   */
  workspaceList() {
    return this.run('workspace', ['list']).then(it => {
      const reg = /[a-z]+/gm;

      return it.toString().match(reg);
    });
  }

  /**
   * https://www.terraform.io/docs/commands/plan.html
   * @return {Promise}
   */
  plan() {
    const options = { '-out': this._metadata.getPlanPath(), '-input': false };
    const args = process.env.planDestroy === 'true' ? ['-no-color', '-destroy'] : ['-no-color'];

    const promiseFunction = () => this.run('plan',
      args.concat(this._varFile(), this._var(), this._optsToArgs(options)));

    return exponentialBackoff(promiseFunction,
      { conditionFunction: this._checkIgnoreErrorPlan, maxRetries: config.retryCount })
      .then(data => {
        const metadata = {};
        const regex = /\s*Plan: ([0-9]+) to add, ([0-9]+) to change, ([0-9]+) to destroy\./;
        const planData = data.toString().match(regex);

        let skip = false;
        if (planData) {
          const planCounter = planData.slice(-3);
          ['add', 'change', 'destroy'].forEach((field, index) => metadata[field] = planCounter[index]);
        } else {
          ['add', 'change', 'destroy'].forEach((field) => metadata[field] = '0');
          skip = true;
        }

        const planPath = this._metadata.getPlanPath();

        if (fse.existsSync(planPath)) {
          const backupPath = this._metadata.getPlanBackupPath();
          const planContent = fse.readFileSync(planPath).toString();

          fse.outputFileSync(backupPath, planContent);
        }

        return Promise.resolve({
          data: data,
          skip: skip,
          metadata: metadata
        });
      });
  }

  /**
   * @param {Error} error
   * @return {Boolean}
   * @private
   */
  _checkIgnoreErrorPlan(error) {
    return [/EOF/, /timeout/].some(it => it.test(error.message));
  }

  /**
   * https://www.terraform.io/docs/commands/apply.html
   * @return {Promise}
   */
  apply() {
    const options = { '-backup': this._metadata.getStateBackupPath(), '-auto-approve': true, '-input': false };

    return this
      .run('apply', ['-no-color'].concat(this._optsToArgs(options), this._metadata.getPlanPath()))
      .then(() => this._getStateContent())
      .then(buffer => ({ buffer: buffer }));
  }

  /**
   * Get state content whether is remote or local
   * @return {Promise}
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
   * @return {Promise}
   */
  destroy() { return this.apply(); }

  /**
   * https://www.terraform.io/docs/commands/refresh.html
   * @return {Promise}
   */
  refresh() {
    const options = { '-backup': this._metadata.getStateBackupPath(), '-input': false };

    return this
      .run('refresh', ['-no-color'].concat(this._optsToArgs(options), this._varFile(), this._var()));

  }

  /**
   * https://www.terraform.io/docs/commands/show.html
   * @param {String} planOrStatePath
   * @return {Promise}
   */
  show(planOrStatePath) {
    return this.run('show', ['-no-color', planOrStatePath]);
  }

  /**
   * Run terraform command
   * @param {String} cmd
   * @param {Array} args
   * @return {Promise}
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
   * @return {Array}
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
   * @return {Promise}
   * @private
   */
  _spawn(command, args, options) {
    return spawner(
      command, args, options,
      err => logger.error(this._out(err)),
      data => {
        if (this._showLogs) {
          logger.raw(this._out(data));
        }
      }
    );
  }

  /**
   * @param {Buffer} data
   * @return {String}
   * @private
   */
  _out(data) {
    return `[${this.getName()}] ${data.toString()}`;
  }
}

module.exports = Terraform;
