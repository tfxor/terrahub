'use strict';

const fs = require('fs');
const path = require('path');

class State {
  /**
   * @param {Object} config
   */
  constructor(config) {
    const root = path.join(config.app, config.root);
    const workspaceDir = path.join(root, State.DIR, config.terraform.workspace);

    this._base = fs.existsSync(workspaceDir)
      ? workspaceDir
      : path.join(root, config.terraform.resource);
  }

  /**
   * @param {String} suffix
   * @returns {String}
   * @private
   */
  _path(suffix = '') {
    return path.join(this._base, [State.NAME].concat(suffix).filter(Boolean).join('.'));
  }

  /**
   * @returns {String}
   */
  getPath() {
    return this._path();
  }

  /**
   * @returns {String}
   */
  getBackupPath() {
    return this._path(`${ Date.now() }.backup`);
  }

  /**
   * @returns {String}
   */
  getRemotePath() {
    return this._path('remote');
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
