'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const merge = require('lodash.merge');
const Plan = require('./plan');
const State = require('./state');
const semver = require('semver');
const logger = require('./logger');
const { spawn } = require('child-process-promise');
const Downloader = require('./downloader');
const { defaultConfig } = require('../parameters');

class Terraform {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this._config = merge({}, this._defaults(), config);
    this._tf = this._config.terraform;
    this._isRemoteState = false;
    this._isWorkspaceSupported = false;
    this._plan = new Plan(this.getResource());
    this._state = new State(this.getResource());
  }

  /**
   * @returns {Object}
   * @private
   */
  _defaults() {
    return {
      terraform: {
        vars: {},
        varFiles: [],
        cache: false,
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
    return path.join(this._config.app, this._config.root);
  }

  /**
   * @returns {String}
   */
  getBinary() {
    return defaultConfig('terraform', this.getVersion(), 'terraform');
  }

  /**
   * @returns {String}
   */
  getResource() {
    return path.join(this.getRoot(), this._tf.resource);
  }

  /**
   * @returns {Object}
   * @private
   */
  _vars() {
    let result = [];
    let vars = this._tf.vars;

    Object.keys(vars).forEach(name => {
      result.push(`-var ${name}=${vars[name]}`);
    });

    return result;
  }

  /**
   * Reformat var-files as object
   * @returns {Object}
   * @private
   */
  _varFiles() {
    let result = [];

    this._tf.varFiles.forEach(fileName => {
      result.push(`-var-file=${path.join(this.getRoot(), fileName)}`);
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
      .then(() => this._checkRemoteState());
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
   * Check if remote state configured
   * @private
   */
  _checkRemoteState() {
    const statePath = path.join(this.getRoot(), '.terraform', State.NAME);

    if (fs.existsSync(statePath)) {
      const state = fse.readJsonSync(statePath);
      this._isRemoteState = state.hasOwnProperty('backend')
        ? state['backend'].hasOwnProperty('type')
        : false;
    }
  }

  /**
   * Check if workspaces supported
   * @private
   */
  _checkWorkspaceSupport() {
    this._isWorkspaceSupported = semver.satisfies(this.getVersion(), '>=0.9.0');
  }

  /**
   * https://www.terraform.io/docs/commands/init.html
   * @returns {Promise}
   */
  init() {
    return this.run('init', ['-no-color', '.']);
  }

  /**
   * https://www.terraform.io/docs/commands/state/pull.html
   * @param {String} argument
   * @returns {Promise}
   */
  state(argument = 'pull') {
    if (!this._isRemoteState) {
      return Promise.resolve();
    }

    return this.run('state', ['-no-color', argument]).then(result => {
      const remoteState = this._state.getRemotePath();

      if (fs.existsSync(remoteState)) {
        fse.moveSync(remoteState, this._state.getBackupPath());
      }

      return fse.writeJson(remoteState, JSON.parse(result.toString()));
    });
  }

  /**
   * https://www.terraform.io/docs/state/workspaces.html
   * @returns {Promise}
   */
  workspace() {
    if (!this._isWorkspaceSupported) {
      return Promise.resolve();
    }

    const workspace = this._tf.workspace;
    const regex = new RegExp(`(\\*\\s|\\s.)${workspace}$`, 'm');

    return this.run('workspace', ['list']).then(result => {
      this._plan.refresh(workspace);
      this._state.refresh(workspace);

      return this.run('workspace', [
        regex.test(result.toString()) ? 'select' : 'new',
        workspace
      ]);
    });
  }

  /**
   * https://www.terraform.io/docs/commands/plan.html
   * @returns {Promise}
   */
  plan() {
    let statePath = this._state.getPath();
    let options = { '-out': this._plan.getPath() };

    if (!this._isRemoteState && fs.existsSync(statePath)) {
      options['-state'] = statePath;
    }

    return this.run('plan', ['-no-color'].concat(this._varFiles(), this._vars(), this._optsToArgs(options)));
  }

  /**
   * https://www.terraform.io/docs/commands/apply.html
   * @returns {Promise}
   */
  apply() {
    let params = {};
    let planPath = this._plan.getPath();
    let statePath = this._state.getPath();

    if (!this._isRemoteState) {
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

    let options = Object.assign({ '-auto-approve': true }, params);

    return this
      .run('apply', ['-no-color'].concat(this._varFiles(), this._vars(), this._optsToArgs(options)))
      .then(() => fse.readFile(statePath));
  }

  /**
   * https://www.terraform.io/docs/commands/destroy.html
   * @returns {Promise}
   */
  destroy() {
    let options = {};
    let statePath = this._state.getPath();

    if (!this._isRemoteState && fs.existsSync(statePath)) {
      Object.assign(options, {
        '-state': statePath,
        '-backup': this._state.getBackupPath(),
        '-state-out': statePath
      });
    }

    return this
      .run('destroy', ['-no-color', '-force'].concat(this._varFiles(), this._vars(), this._optsToArgs(options)))
      .then(() => fse.readFile(statePath));
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
    logger.warn(`[${this.getName()}] terraform ${cmd} ${args.join(' ')}`);

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
    let stdout = [];
    const promise = spawn(command, args, options);
    const child = promise.childProcess;

    child.stderr.on('data', data => logger.error(this._out(data)));
    child.stdout.on('data', data => {
      stdout.push(data);
      logger.raw(this._out(data));
    });

    return promise.then(() => Buffer.concat(stdout));
  }

  /**
   * @param {Buffer} data
   * @returns {string}
   * @private
   */
  _out(data) {
    return `[${this.getName()}] ${data.toString()}`;
  }
}

module.exports = Terraform;
