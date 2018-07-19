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
    this.reBase();
    this._isRemote = false;
    const remoteStatePath = path.join(this._root, '.terraform', State.NAME);

    if (fse.existsSync(remoteStatePath)) {
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
}

module.exports = State;
