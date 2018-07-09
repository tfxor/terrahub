'use strict';

const fs = require('fs');
const path = require('path');
const State = require('./state');

class Plan {
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
