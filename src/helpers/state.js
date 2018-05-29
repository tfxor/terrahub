'use strict';

const fse = require('fs-extra');

/**
 * @todo Implement this class in order to cleanup terraform class
 * Terraform state
 */
class State {
  /**
   * @param {String} root
   */
  constructor(root) {
    this._root = root;
    this._remote = this._path('remote');
    this._backup = this._path(`${ new Date().getTime() }.backup`);
  }

  /**
   * @param {String} suffix
   * @returns {String}
   * @private
   */
  _path(suffix = '') {
    return [State.NAME].concat(suffix).filter(Boolean).join('.');
  }

  /**
   * @returns {string}
   */
  getPath() {
    return '';
  }

  /**
   * @returns {string}
   */
  getBackupPath() {
    return '';
  }

  getRemotePath() {
    return '';
  }

  /**
   * @returns {Promise}
   */
  getState() {
    return fse.readJson(this.getPath());
  }

  /**
   * @returns {Promise}
   */
  getBackupState() {
    return fse.readJson(this._backup);
  }

  /**
   * @returns {Promise}
   */
  getRemoteState() {
    return fse.readJson(this._remote);
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
