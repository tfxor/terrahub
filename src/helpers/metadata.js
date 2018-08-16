'use strict';

const fse = require('fs-extra');
const path = require('path');

class Metadata {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this._cfg = config;
    this._base = false;
    this._root = path.join(this._cfg.project.root, this._cfg.root);

    this._isRemote = false;
    const remoteStatePath = this._getRemoteStatePath();

    if (fse.existsSync(remoteStatePath)) {
      const state = fse.readJsonSync(remoteStatePath);
      this._isRemote = state.hasOwnProperty('backend') ? state['backend'].hasOwnProperty('type') : false;
    }

    this.init();
  }

  /**
   * Init
   */
  init() {
    this.reBase();
  }

  /**
   * Re-init base path
   */
  reBase() {
    const workspaceDir = path.join(this._root, Metadata.STATE_DIR, this._cfg.terraform.workspace);

    this._base = fse.existsSync(workspaceDir) ? workspaceDir : this._root;
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
    return path.join(this._root, '.terraform', Metadata.STATE);
  }

  /**
   * @returns {String}
   * @private
   */
  _getBackupDir() {
    const backup = this._cfg.terraform.backup;
    const workspace = this._cfg.terraform.workspace;

    return backup ?
      path.join(this._root, backup, workspace === 'default' ? './' : workspace) :
      this._isRemote ?
        path.join(this._root, '.terraform', '.backup', workspace === 'default' ? './' : workspace) :
        path.join(this._base, '.backup');
  }

  /**
   * @return {String}
   */
  getStateBackupPath() {
    return path.join(this._getBackupDir(), 'tfstate', `${ Metadata.STATE }.${ Date.now() }.backup`);
  }

  /**
   * @return {String}
   */
  getPlanBackupPath() {
    return path.join(this._getBackupDir(), 'tfplan', `${ Metadata.PLAN }.${ Date.now() }.backup`);
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
