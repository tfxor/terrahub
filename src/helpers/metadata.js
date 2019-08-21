'use strict';

const path = require('path');
const fse = require('fs-extra');
const { buildTmpPath } = require('./jit-helper');

class Metadata {
  /**
   * @param {Object} config
   * @param {Object} parameters
   */
  constructor(config, parameters) {
    this._cfg = config;
    this._parameters = parameters;
    this._base = false;
    this._isRemote = false;

    this.init();
  }

  /**
   * Init
   */
  init() {
    const remoteStatePath = this._getRemoteStatePath();

    if (fse.existsSync(remoteStatePath)) {
      const state = fse.readJsonSync(remoteStatePath);
      this._isRemote = state.hasOwnProperty('backend') ? state['backend'].hasOwnProperty('type') : false;
    }

    this.reBase();
  }

  /**
   * @return {String}
   */
  getRoot() {
    return this._cfg.isJit
      ? buildTmpPath(this._cfg, this._parameters)
      : path.join(this._cfg.project.root, this._cfg.root);
  }

  /**
   * Re-init base path
   */
  reBase() {
    const workspaceDir = path.join(this.getRoot(), Metadata.STATE_DIR, this._cfg.terraform.workspace);

    this._base = fse.existsSync(workspaceDir) ? workspaceDir : this.getRoot();
  }

  /**
   * Check if remote state configured
   * @returns {Boolean}
   */
  isRemote() {
    return this._isRemote;
  }

  /**
   * @returns {String}
   */
  getPlanPath() {
    return path.join(this._base, Metadata.PLAN);
  }

  /**
   * @returns {String}
   */
  getStatePath() {
    return path.join(this._base, Metadata.STATE);
  }

  /**
   * @returns {String}
   * @private
   */
  _getRemoteStatePath() {
    return path.join(this.getRoot(), '.terraform', Metadata.STATE);
  }

  /**
   * @returns {String}
   * @private
   */
  _getBackupDir() {
    const backup = this._cfg.terraform.backup || '.backup';
    const { workspace } = this._cfg.terraform;
    const realRootPath = path.join(this._cfg.project.root, this._cfg.root);

    // @todo discuss w/ Eugene how and where to backup
    return path.join(realRootPath, backup, workspace === 'default' ? './' : workspace);
  }

  /**
   * @return {String}
   */
  getStateBackupPath() {
    return path.join(this._getBackupDir(), 'tfstate', `${Metadata.STATE}.${Date.now()}.backup`);
  }

  /**
   * @return {String}
   */
  getPlanBackupPath() {
    return path.join(this._getBackupDir(), 'tfplan', `${Metadata.PLAN}.${Date.now()}.backup`);
  }

  /**
   * @returns {String}
   */
  static get STATE_DIR() {
    return 'terraform.tfstate.d';
  }

  /**
   * @return {String}
   */
  static get PLAN() {
    return 'terraform.tfplan';
  }

  /**
   * @return {String}
   */
  static get STATE() {
    return 'terraform.tfstate';
  }
}

module.exports = Metadata;
