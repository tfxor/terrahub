'use strict';

const fs = require('fs');
const path = require('path');
const State = require('./state');

/**
 * Terraform plan
 */
class Plan {
  /**
   * @param {Object} config
   */
  constructor(config) {
    const root = path.join(config.app, config.root);
    const stateDir = path.join(root, State.DIR);

    this._base = fs.existsSync(stateDir)
      ? path.join(stateDir, config.terraform.workspace)
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
