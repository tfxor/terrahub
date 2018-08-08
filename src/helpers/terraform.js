'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const Plan = require('./plan');
const State = require('./state');
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
    this._plan = new Plan(this._config);
    this._state = new State(this._config);
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
        resource: '.resource',
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
    return path.join(this.getRoot(), this._tf.resource);
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
    let result = [];
    let object = this._tf.var;

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
    let result = [];
    let object = this._tf.backend;

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
    let result = [];

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
      .then(() => this._checkResourceDir())
    ;
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
    this._plan.init();
    this._state.init();

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
    if (!this._state.isRemote()) {
      return Promise.resolve();
    }

    this._showLogs = false;

    return this.run('state', ['pull', '-no-color']).then(result => {
      this._showLogs = true;
      const pullStatePath = this._state.getPullPath();
      const pullStateContent = JSON.parse(result.toString());

      if (fs.existsSync(pullStatePath)) {
        fse.moveSync(pullStatePath, this._state.getBackupPath());
      }

      return fse.writeJson(pullStatePath, pullStateContent);
    });
  }

  /**
   * https://www.terraform.io/docs/commands/output.html
   * @returns {Promise}
   */
  output() {
    const options = {};

    if (fs.existsSync(this._state.getPath())) {
      options['-state'] = this._state.getPath();
    }

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
    const regex = new RegExp(`(\\*\\s|\\s.)${workspace}$`, 'm');

    return this.run('workspace', ['list'])
      .then(result => this.run('workspace', [ regex.test(result.toString()) ? 'select' : 'new', workspace ]))
      .then(() => this._reInitPaths())
    ;
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
    let statePath = this._state.getPath();
    let options = { '-out': this._plan.getPath(), '-input': false };

    if (!this._state.isRemote() && fs.existsSync(statePath)) {
      options['-state'] = statePath;
    }

    return this.run('plan', ['-no-color'].concat(this._varFile(), this._var(), this._optsToArgs(options)));
  }

  /**
   * https://www.terraform.io/docs/commands/apply.html
   * @returns {Promise}
   */
  apply() {
    let params = {};
    let planPath = this._plan.getPath();
    let statePath = this._state.getPath();

    if (!this._state.isRemote()) {
      if (fs.existsSync(statePath)) {
        params = {
          '-state': statePath,
          '-backup': this._state.getBackupPath(),
          '-state-out': statePath
        };
      } else if (fs.existsSync(planPath)) {
        params = { '-state-out': statePath };
      }
    }

    let options = Object.assign({ '-auto-approve': true, '-input': false }, params);

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
    if (this._state.isRemote()) {
      return this.statePull().then(() => fse.readFile(this._state.getPullPath()));
    }

    return fse.readFile(this._state.getPath());
  }

  /**
   * https://www.terraform.io/docs/commands/destroy.html
   * @returns {Promise}
   */
  destroy() {
    let options = {};
    let statePath = this._state.getPath();

    if (!this._state.isRemote() && fs.existsSync(statePath)) {
      Object.assign(options, {
        '-state': statePath,
        '-backup': this._state.getBackupPath(),
        '-state-out': statePath
      });
    }

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
    if (process.env.format !== 'json') {
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
    let args = [];

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

      return Buffer.concat(stdout)
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
