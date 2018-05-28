'use strict';

const os = require('os');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const merge = require('lodash.merge');
const semver = require('semver');
const logger = require('./logger');
const { spawn } = require('child-process-promise');
const Downloader = require('./downloader');

class Terraform {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this._config = merge({}, this._defaults(), config);
    this._tf = this._config.terraform;
    this._resource = false;
    this._isRemoteState = false;
    this._isWorkspaceSupported = false;
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
    return path.join(Terraform.THUB_HOME, 'terraform', this.getVersion(), 'terraform');
  }

  /**
   * @returns {String}
   */
  getResource() {
    return this._resource
      ? this._resource
      : path.join(this.getRoot(), this._tf.resource);
  }

  /**
   * @returns {Object}
   */
  getVars() {
    const vars = {};

    Object.keys(this._tf.vars).forEach(name => {
      vars[`TF_VAR_${ name }`] = this._tf.vars[name];
    });

    return vars;
  }

  /**
   * @returns {Array}
   */
  getVarFiles() {
    return this._tf.varFiles;
  }

  /**
   * @param suffix
   * @returns {String}
   * @private
   */
  _statePath(suffix = '') {
    const stateName = [Terraform.STATE].concat(suffix).filter(Boolean).join('.');

    return path.join(this.getResource(), stateName);
  }

  /**
   * @returns {String}
   * @private
   */
  _planPath() {
    return path.join(this.getResource(), Terraform.PLAN);
  }

  /**
   * Reformat var-files as object
   * @returns {Object}
   * @private
   */
  _varFilesOption() {
    let options = {};

    this.getVarFiles().forEach(fileName => {
      options['-var-file'] = path.join(this.getRoot(), fileName);
    });

    return options;
  }

  /**
   * Perform terraform init & all required checks
   * @returns {Promise}
   */
  prepare() {
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
    const statePath = path.join(this.getRoot(), '.terraform', Terraform.STATE);

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
    return this.run('init', ['.']);
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

    return this.run('state', [argument]).then(result => {
      const remoteState = this._statePath('remote');

      if (fs.existsSync(remoteState)) {
        fse.moveSync(remoteState, this._statePath(`${ new Date().getTime() }.backup`));
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
      let action = regex.test(result.toString()) ? 'select' : 'new';
      let stateDir = path.join(this.getRoot(), 'terraform.tfstate.d');

      if (fs.existsSync(stateDir)) {
        this._resource = `${stateDir}/${workspace}`;
      }

      return this.run('workspace', [action, workspace]);
    });
  }

  /**
   * https://www.terraform.io/docs/commands/plan.html
   * @returns {Promise}
   */
  plan() {
    let statePath = this._statePath();
    let options = Object.assign({'-out': this._planPath()}, this._varFilesOption());

    if (!this._isRemoteState && fs.existsSync(statePath)) {
      options['-state'] = statePath;
    }

    return this.run('plan', this._optsToArgs(options));
  }

  /**
   * https://www.terraform.io/docs/commands/apply.html
   * @returns {Promise}
   */
  apply() {
    let args = [];
    let options = {'-auto-approve': true};
    let planPath = this._planPath();
    let statePath = this._statePath();
    let backupState = this._statePath(`${ new Date().getTime() }.backup`);

    // @todo refactor this!
    if (!this._isRemoteState && fs.existsSync(statePath)) {
      Object.assign(options, this._varFilesOption(), {
        '-state': statePath,
        '-backup': backupState,
        '-state-out': statePath
      });
    } else if (fs.existsSync(planPath)) {
      if (!this._isRemoteState) {
        Object.assign(options, this._varFilesOption(), {
          '-state-out': statePath
        });
      }
      // args.push(planPath);
    }

    return this.run('apply', [...args, ...this._optsToArgs(options)]);
  }

  /**
   * https://www.terraform.io/docs/commands/destroy.html
   * @returns {Promise}
   */
  destroy() {
    let options = this._varFilesOption();
    let statePath = this._statePath();
    let backupState = this._statePath(`${ new Date().getTime() }.backup`);

    if (!this._isRemoteState && fs.existsSync(statePath)) {
      Object.assign(options, {
        '-state': statePath,
        '-backup': backupState,
        '-state-out': statePath
      });
    }

    return this.run('destroy', ['-force', ...this._optsToArgs(options)]);
  }

  /**
   * https://www.terraform.io/docs/commands/show.html
   * @param {String} planOrStatePath
   * @returns {Promise}
   */
  show(planOrStatePath) {
    return this.run('show', [planOrStatePath]);
  }

  /**
   * Run terraform command
   * @param {String} cmd
   * @param {Array} args
   * @returns {Promise}
   */
  run(cmd, args) {
    logger.info(`[${this.getName()}]`, 'terraform', cmd, '-no-color', ...args);

    return this._spawn(this.getBinary(), [cmd, '-no-color', ...args], {
      env: Object.assign({}, process.env, this.getVars()),
      cwd: this.getRoot(),
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
    const prefix = `[${this.getName()}]`;
    const promise = spawn(command, args, options);
    const child = promise.childProcess;

    child.stderr.on('data', data => logger.error(prefix, data.toString()));
    child.stdout.on('data', data => {
      stdout.push(data);
      logger.raw(prefix, data.toString());
    });

    return promise.then(() => Buffer.concat(stdout));
  }

  /**
   * @returns {String}
   */
  static get PLAN() {
    return 'terraform.tfplan';
  }

  /**
   * @returns {String}
   */
  static get STATE() {
    return 'terraform.tfstate';
  }

  /**
   * // @todo move to a global config!
   * @returns {String}
   */
  static get THUB_HOME() {
    return path.join(os.homedir(), '.terrahub');
  }
}

module.exports = Terraform;
