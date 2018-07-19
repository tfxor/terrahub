'use strict';

const fs = require('fs');
const path = require('path');
const State = require('./state');

class Plan {
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
   * @desc check if workspace dir exists
   */
  init() {
    const workspaceDir = path.join(this._root, State.DIR, this._cfg.terraform.workspace);

    this._base = fs.existsSync(workspaceDir)
      ? workspaceDir
      : path.join(this._root, this._cfg.terraform.resource);
  }

  /**
   * @returns {String}
   */
  getPath() {
    return path.join(this._base, Plan.NAME);
  }

  /**
   * @returns {String}
   */
  static get NAME() {
    return 'terraform.tfplan';
  }
}

module.exports = Plan;
