'use strict';

const fse = require('fs-extra');
const path = require('path');

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
    return fse.readJson(this._path);
  }

  /**
   * @returns {Promise}
   */
  getBackupState() {
    return fse.readJson(this._backupPath);
  }

  /**
   * @returns {Promise}
   */
  getRemoteState() {
    return fse.readJson(this._backupPath);
  }

  /**
   * @returns {String}
   */
  static get NAME() {
    return 'terraform.tfstate';
  }
}

module.exports = State;
