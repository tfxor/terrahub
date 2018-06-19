'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Terraform state
 */
class State {
  /**
   * @param {String} baseDir
   */
  constructor(baseDir) {
    this._base = baseDir;
  }

  /**
   * @param {String} suffix
   * @returns {String}
   * @private
   */
  _path(suffix = '') {
    return path.join(
      this.getBase(),
      [State.NAME].concat(suffix).filter(Boolean).join('.')
    );
  }

  /**
   * @returns {String}
   */
  getBase() {
    return this._base;
  }

  /**
   * @param {String} workspace
   */
  refresh(workspace) {
    let stateDir = path.join(this._base, State.DIR);

    if (fs.existsSync(stateDir)) {
      this._base = `${stateDir}/${workspace}`;
    }
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
    return this._path(`${ new Date().getTime() }.backup`);
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
