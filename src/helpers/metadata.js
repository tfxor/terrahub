'use strict';

const fs = require('fs');
const path = require('path');

class Metadata {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this._cfg = config;
    this._base = false;
    this._root = path.join(this._cfg.app, this._cfg.root);

    this.init();
  }

  /**
   * Init
   * @abstract
   */
  init() {}

  /**
   * Re-init base path
   */
  reBase() {
    const workspaceDir = path.join(this._root, Metadata.STATE_DIR, this._cfg.terraform.workspace);

    this._base = fs.existsSync(workspaceDir)
      ? workspaceDir
      : path.join(this._root, this._cfg.terraform.resource);
  }

  /**
   * @returns {String}
   */
  getPath() {
    return path.join(this._base, this.constructor.NAME);
  }

  /**
   * @returns {String}
   */
  static get STATE_DIR() {
    return 'terraform.tfstate.d';
  }
}

module.exports = Metadata;
