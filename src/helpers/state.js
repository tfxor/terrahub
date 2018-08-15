'use strict';

const fse = require('fs-extra');
const path = require('path');
const Metadata = require('./metadata');

class State extends Metadata {
  /**
   * Init
   * @desc check if state is remote and if workspace dir exists
   */
  init() {
    this._isRemote = false;
    const remoteStatePath = this._getRemotePath();

    if (fse.existsSync(remoteStatePath)) {
      const state = fse.readJsonSync(remoteStatePath);
      this._isRemote = state.hasOwnProperty('backend') ? state['backend'].hasOwnProperty('type') : false;
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
  getBackupPath() {
    const backup = this._cfg.terraform.backup;
    const workspace = this._cfg.terraform.workspace;

    let backupPath;
    if (backup) {
      backupPath = path.join(this._root, backup, workspace === 'default' ? './' : workspace);
    } else {
      backupPath = this._isRemote ?
        path.join(this._root, '.terraform', '.backup', workspace === 'default' ? './' : workspace) :
        path.join(this._base, '.backup');
    }

    return path.join(backupPath, 'tfstate', `${ State.NAME }.${ Date.now() }.backup`);
  }

  /**
   * @returns {String}
   * @private
   */
  _getRemotePath() {
    return path.join(this._root, '.terraform', State.NAME);
  }

  /**
   * @returns {String}
   */
  static get NAME() {
    return 'terraform.tfstate';
  }
}

module.exports = State;
