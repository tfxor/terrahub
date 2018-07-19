'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

class State {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this._cfg = config;
    this._root = path.join(this._cfg.app, this._cfg.root);

    this.init();
  }

  /**
   * Init
   * @desc check if state is remote and if workspace dir exists
   */
  init() {
    const workspaceDir = path.join(this._root, State.DIR, this._cfg.terraform.workspace);
    const remoteStatePath = path.join(this._root, '.terraform', State.NAME);

    this._isRemote = false;
    this._base = fs.existsSync(workspaceDir)
      ? workspaceDir
      : path.join(this._root, this._cfg.terraform.resource);

    if (fs.existsSync(remoteStatePath)) {
      const state = fse.readJsonSync(remoteStatePath);
      this._isRemote = state.hasOwnProperty('backend')
        ? state['backend'].hasOwnProperty('type')
        : false;
    }
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
  getPath() {
    return path.join(this._base, State.NAME);
  }

  /**
   * @returns {String}
   */
  getBackupPath() {
    return path.join(this._base, `${ State.NAME }.${ Date.now() }.backup`);
  }

  /**
   * @returns {String}
   */
  getRemoteBackupPath() {
    return path.join(this._base, `${State.NAME}.remote`);
  }

  /**
   * @returns {String}
   */
  getRemotePath() {
    return path.join(this._root, '.terraform', State.NAME);
  }

  /**
   * @returns {String}
   */
  static get NAME() {
    return 'terraform.tfstate';
  }

  /**
   * @returns {String}
   */
  static get DIR() {
    return 'terraform.tfstate.d';
  }
}

module.exports = State;
