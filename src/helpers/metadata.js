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
    this._backup = false;
    this._root = path.join(this._cfg.project.root, this._cfg.root);

    this.reBase();
    this.reBackup();

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

    this._base = fs.existsSync(workspaceDir) ? workspaceDir : this._root;
  }

  /**
   * Re-init backup path
   */
  reBackup() {
    const backup = this._cfg.terraform.backup;

    if (backup) {
      const workspaceDir = path.join(this._root, Metadata.STATE_DIR, this._cfg.terraform.workspace);

      this._backup = fs.existsSync(workspaceDir)
        ? path.join(this._root, backup, this._cfg.terraform.workspace)
        : path.join(this._root, backup);
    } else {
      this._backup = path.join(this._base, '.backup');
    }
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
